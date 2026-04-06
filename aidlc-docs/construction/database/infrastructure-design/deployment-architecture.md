# Database Deployment Architecture

## Overview

이 문서는 Database unit의 배포 아키텍처, 네트워크 토폴로지, 배포 프로세스, 운영 절차를 정의합니다.

**Deployment Method**: AWS CloudFormation  
**Target Region**: ap-northeast-2 (Seoul)  
**Environment**: Production (MVP)

---

## 1. Overall Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           AWS Cloud (ap-northeast-2)                        │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    VPC: 10.0.0.0/16                                   │ │
│  │                                                                       │ │
│  │  ┌────────────────────────┐       ┌────────────────────────┐        │ │
│  │  │  Private Subnet 1      │       │  Private Subnet 2      │        │ │
│  │  │  10.0.1.0/24           │       │  10.0.2.0/24           │        │ │
│  │  │  AZ: ap-northeast-2a   │       │  AZ: ap-northeast-2b   │        │ │
│  │  │                        │       │                        │        │ │
│  │  │  ┌──────────────────┐  │       │                        │        │ │
│  │  │  │  RDS PostgreSQL  │  │       │  (Subnet for DB subnet │        │ │
│  │  │  │  table-order-db  │  │       │   group requirement)   │        │ │
│  │  │  │                  │  │       │                        │        │ │
│  │  │  │  Instance:       │  │       │                        │        │ │
│  │  │  │  db.t3.medium    │  │       │                        │        │ │
│  │  │  │  Storage: 20GB   │  │       │                        │        │ │
│  │  │  │  gp3, encrypted  │  │       │                        │        │ │
│  │  │  └────────┬─────────┘  │       │                        │        │ │
│  │  │           │            │       │                        │        │ │
│  │  └───────────┼────────────┘       └────────────────────────┘        │ │
│  │              │                                                       │ │
│  │     ┌────────▼─────────────────────────────────────┐                │ │
│  │     │  DB Subnet Group                             │                │ │
│  │     │  (Subnets: PrivateSubnet1, PrivateSubnet2)   │                │ │
│  │     └──────────────────────────────────────────────┘                │ │
│  │                                                                       │ │
│  │  ┌─────────────────────────────────────────────────────────────┐    │ │
│  │  │  Security Group: Database-SG                                │    │ │
│  │  │  Inbound:  Port 5432 from Backend-SG                        │    │ │
│  │  │  Outbound: All traffic (for RDS management)                 │    │ │
│  │  └─────────────────────────────────────────────────────────────┘    │ │
│  │                                                                       │ │
│  │  ┌──────────────────────────────────────────────┐                    │ │
│  │  │  Public Subnet (Backend - future)            │                    │ │
│  │  │  10.0.10.0/24 (to be added)                  │                    │ │
│  │  │                                               │                    │ │
│  │  │  ┌────────────────────────┐                  │                    │ │
│  │  │  │  Backend EC2           │                  │                    │ │
│  │  │  │  (Future deployment)   │                  │                    │ │
│  │  │  │  - IAM Instance Profile│                  │                    │ │
│  │  │  │  - Security Group      │                  │                    │ │
│  │  │  └────────────────────────┘                  │                    │ │
│  │  └──────────────────────────────────────────────┘                    │ │
│  │                          │                                            │ │
│  └──────────────────────────┼────────────────────────────────────────────┘ │
│                             │                                              │
│                             │ (Secrets Manager API)                        │
│                             ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                      AWS Secrets Manager                             │ │
│  │  Secret: table-order-database-credentials                            │ │
│  │  - username, password, host, port, dbname                            │ │
│  │  - Encrypted with KMS                                                │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                      AWS KMS                                         │ │
│  │  Key: alias/table-order-database                                     │ │
│  │  - Encrypts: RDS storage, secrets, logs                              │ │
│  │  - Key rotation: Enabled (annual)                                    │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                      Amazon CloudWatch                               │ │
│  │  - Logs: /aws/rds/instance/table-order-db/postgresql                 │ │
│  │  - Alarms: CPU, Connections, Storage, Memory, Latency (6 alarms)    │ │
│  │  - Dashboard: TableOrder-Database                                    │ │
│  │  - SNS Topic: table-order-database-alarms → Email notification       │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                        Developer Workstation                                │
│  - AWS CLI / CloudFormation CLI                                            │
│  - Git (infrastructure code versioning)                                    │
│  - Database migration tools (Knex.js CLI)                                  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Network Topology

### 2.1 VPC Layout

```
VPC: 10.0.0.0/16 (table-order-vpc)
│
├── Private Subnet 1: 10.0.1.0/24 (ap-northeast-2a)
│   ├── RDS Instance: table-order-db (Primary placement)
│   └── Usable IPs: 251 (256 - 5 AWS reserved)
│
├── Private Subnet 2: 10.0.2.0/24 (ap-northeast-2b)
│   ├── RDS Subnet Group member (required for Multi-AZ capability)
│   └── Usable IPs: 251
│
└── (Future) Public Subnet: 10.0.10.0/24 (Backend deployment)
    └── Backend EC2 instances
```

### 2.2 Network Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Network Traffic Flow                        │
└─────────────────────────────────────────────────────────────────┘

1. Backend → Database (PostgreSQL Query):
   ┌──────────────┐         ┌──────────────┐         ┌──────────┐
   │  Backend EC2 │ ─(1)──> │  Backend-SG  │ ─(2)──> │ Database │
   │  (Future)    │         │  Allow 5432  │         │  -SG     │
   └──────────────┘         └──────────────┘         └────┬─────┘
                                                           │
                                                          (3)
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  RDS         │
                                                    │  PostgreSQL  │
                                                    └──────────────┘

   (1) Backend initiates connection to RDS endpoint (port 5432)
   (2) Backend-SG allows outbound, Database-SG allows inbound from Backend-SG
   (3) Connection established, query executed

2. Backend → Secrets Manager (Credential Retrieval):
   ┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
   │  Backend EC2 │ ─(1)──> │  IAM Instance    │ ─(2)──> │  Secrets     │
   │  (with IAM)  │         │  Profile         │         │  Manager API │
   └──────────────┘         └──────────────────┘         └──────┬───────┘
                                                                  │
                                                                 (3)
                                                                  │
                                                                  ▼
                                                           ┌──────────────┐
                                                           │  KMS Decrypt │
                                                           └──────┬───────┘
                                                                  │
                                                                 (4)
                                                                  │
                                                                  ▼
                                                           ┌──────────────┐
                                                           │  Return      │
                                                           │  Credentials │
                                                           └──────────────┘

   (1) Backend requests secret via AWS SDK
   (2) IAM instance profile provides authentication
   (3) Secrets Manager decrypts using KMS
   (4) Credentials returned to Backend

3. RDS → CloudWatch (Metrics & Logs):
   ┌──────────────┐         ┌──────────────────┐
   │  RDS         │ ─(1)──> │  CloudWatch      │
   │  PostgreSQL  │         │  Metrics         │
   └──────────────┘         └──────────────────┘
                                     │
                                    (2)
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  CloudWatch      │
                            │  Alarms          │
                            └─────────┬────────┘
                                      │
                                     (3) Threshold exceeded
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  SNS Topic       │
                            └─────────┬────────┘
                                      │
                                     (4)
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  Email to Admin  │
                            └──────────────────┘

   (1) RDS publishes metrics every 60 seconds
   (2) Alarms evaluate metrics every 5 minutes
   (3) Alarm triggers when threshold exceeded
   (4) SNS sends notification
```

### 2.3 Network Security Layers

| Layer | Component | Security Measure |
|-------|-----------|------------------|
| **Layer 1: VPC Isolation** | VPC | Private VPC (10.0.0.0/16), no internet gateway on DB subnets |
| **Layer 2: Subnet Isolation** | Private Subnets | No public IP assignment, no route to internet |
| **Layer 3: Security Groups** | Database-SG | Inbound: Port 5432 from Backend-SG only |
| **Layer 4: IAM** | IAM Roles | EC2 instance profile with least-privilege access |
| **Layer 5: Encryption in Transit** | SSL/TLS | TLS 1.2+ for all database connections |
| **Layer 6: Encryption at Rest** | KMS | AES-256 encryption for storage, backups, snapshots |
| **Layer 7: Credential Management** | Secrets Manager | Centralized credential storage, KMS encrypted |

---

## 3. Security Architecture

### 3.1 Security Zones

```
┌─────────────────────────────────────────────────────────────────┐
│                     Security Zone Architecture                   │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  PUBLIC ZONE (Internet-facing)                                     │
│  - (Future) Application Load Balancer                              │
│  - Public Subnets with Internet Gateway                            │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     │ (HTTPS only)
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  APPLICATION ZONE (Backend)                                        │
│  - Backend EC2 instances                                           │
│  - Security Group: Backend-SG                                      │
│  - IAM Instance Profile (EC2 role)                                 │
│  - Private Subnets (future: 10.0.10.0/24, 10.0.11.0/24)           │
└────────────────────┬───────────────────────────────────────────────┘
                     │
                     │ (PostgreSQL port 5432, TLS encrypted)
                     │
                     ▼
┌────────────────────────────────────────────────────────────────────┐
│  DATA ZONE (Database)                                              │
│  - RDS PostgreSQL                                                  │
│  - Security Group: Database-SG (port 5432 from Backend-SG only)   │
│  - Private Subnets: 10.0.1.0/24, 10.0.2.0/24                      │
│  - No internet access                                              │
│  - Encryption at-rest (KMS)                                        │
│  - Encryption in-transit (SSL/TLS)                                 │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  MANAGEMENT ZONE (AWS Services)                                    │
│  - AWS Secrets Manager (credentials)                               │
│  - AWS KMS (encryption keys)                                       │
│  - Amazon CloudWatch (monitoring)                                  │
│  - Amazon SNS (notifications)                                      │
│  - Accessed via AWS API (IAM authenticated)                        │
└────────────────────────────────────────────────────────────────────┘
```

### 3.2 Access Control Matrix

| Principal | Resource | Access | Method | Purpose |
|-----------|----------|--------|--------|---------|
| **Backend EC2** | RDS Instance | Read/Write (port 5432) | Security Group | Application database access |
| **Backend EC2** | Secrets Manager | Read (GetSecretValue) | IAM Role | Retrieve database credentials |
| **Backend EC2** | KMS | Decrypt | IAM Role | Decrypt secrets |
| **RDS Service** | KMS | Encrypt/Decrypt/GenerateDataKey | Service Role | Encrypt storage and backups |
| **CloudWatch** | RDS Instance | Read metrics | Service Role | Monitoring |
| **CloudWatch** | SNS Topic | Publish | Service Role | Send alarm notifications |
| **Admin** | RDS Instance | Management | AWS Console/CLI (IAM User/Role) | Database administration |
| **Admin** | CloudFormation | Create/Update/Delete | AWS Console/CLI (IAM User/Role) | Infrastructure deployment |
| **Public Internet** | RDS Instance | ❌ Denied | No route | Database is private |

### 3.3 Encryption Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Encryption Architecture                      │
└─────────────────────────────────────────────────────────────────┘

1. Encryption at Rest (KMS):
   ┌──────────────┐
   │  KMS Key     │
   │  alias/      │
   │  table-order-│
   │  database    │
   └──────┬───────┘
          │ (Encrypts)
          │
          ├──────────> RDS Storage (database files)
          │
          ├──────────> Automated Backups
          │
          ├──────────> Manual Snapshots
          │
          ├──────────> CloudWatch Logs
          │
          └──────────> Secrets Manager (credentials)

2. Encryption in Transit (SSL/TLS):
   ┌──────────────┐         ┌──────────────┐
   │  Backend     │ <─TLS─> │  RDS         │
   │  Application │  1.2+   │  PostgreSQL  │
   └──────────────┘         └──────────────┘
   
   Connection string: ?sslmode=require

3. Key Management:
   - KMS Key Rotation: Enabled (automatic annual rotation)
   - Key Policy: Restricts access to RDS service and authorized IAM principals
   - Key Alias: alias/table-order-database (friendly name)
```

---

## 4. Deployment Process

### 4.1 Deployment Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                   CloudFormation Deployment Workflow             │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────┐
│  1. Preparation    │
│  - Review template │
│  - Set parameters  │
│  - Check IAM perms │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  2. Create Stack   │
│  aws cloudformation│
│  create-stack      │
└─────────┬──────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────┐
│  3. CloudFormation Execution (Sequential Resource Creation)    │
│                                                                │
│  Phase 1: Networking (5 min)                                  │
│    └─> VPC → Subnets → Route Tables → Security Groups         │
│                                                                │
│  Phase 2: Security (2 min)                                    │
│    └─> KMS Key → Secrets Manager → IAM Roles                  │
│                                                                │
│  Phase 3: Database (10-15 min)                                │
│    └─> Parameter Group → Subnet Group → RDS Instance          │
│         (RDS instance creation is the longest step)           │
│                                                                │
│  Phase 4: Monitoring (2 min)                                  │
│    └─> Log Group → SNS Topic → Alarms → Dashboard             │
│                                                                │
│  Total Time: ~20-25 minutes                                   │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────────┐
│  4. Post-Deployment Validation                                │
│  - Check stack status: CREATE_COMPLETE                        │
│  - Verify RDS endpoint availability                           │
│  - Test database connectivity                                 │
│  - Verify alarms are active                                   │
│  - Confirm SNS subscription (email confirmation)              │
└─────────────────────┬──────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────────────────┐
│  5. Database Initialization                                   │
│  - Run Knex migrations (create tables)                        │
│  - Run Knex seeds (insert initial data)                       │
│  - Verify schema                                              │
└────────────────────────────────────────────────────────────────┘
```

### 4.2 Deployment Commands

**Step 1: Validate Template**
```bash
aws cloudformation validate-template \
  --template-body file://database-stack.yaml \
  --region ap-northeast-2
```

**Step 2: Create Stack**
```bash
aws cloudformation create-stack \
  --stack-name table-order-database-stack \
  --template-body file://database-stack.yaml \
  --parameters ParameterKey=AdminEmail,ParameterValue=admin@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-northeast-2 \
  --tags \
    Key=Environment,Value=Production \
    Key=Application,Value=TableOrder \
    Key=ManagedBy,Value=CloudFormation
```

**Step 3: Monitor Stack Creation**
```bash
# Watch stack events
aws cloudformation describe-stack-events \
  --stack-name table-order-database-stack \
  --region ap-northeast-2 \
  --query 'StackEvents[*].[Timestamp,ResourceType,ResourceStatus,ResourceStatusReason]' \
  --output table

# Wait for stack to complete
aws cloudformation wait stack-create-complete \
  --stack-name table-order-database-stack \
  --region ap-northeast-2

echo "Stack creation completed!"
```

**Step 4: Get Outputs**
```bash
aws cloudformation describe-stacks \
  --stack-name table-order-database-stack \
  --region ap-northeast-2 \
  --query 'Stacks[0].Outputs' \
  --output table
```

**Step 5: Test Database Connectivity**
```bash
# Get database endpoint and credentials
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name table-order-database-stack \
  --region ap-northeast-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text)

DB_SECRET=$(aws cloudformation describe-stacks \
  --stack-name table-order-database-stack \
  --region ap-northeast-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' \
  --output text)

# Retrieve credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id $DB_SECRET \
  --region ap-northeast-2 \
  --query 'SecretString' \
  --output text | jq .

# Test connection (from EC2 instance with access)
psql "postgresql://table_order_app:PASSWORD@$DB_ENDPOINT:5432/table_order_db?sslmode=require" \
  -c "SELECT version();"
```

**Step 6: Run Migrations**
```bash
# From Backend EC2 instance or local with VPN
cd /path/to/backend
npx knex migrate:latest --env production
npx knex seed:run --env production
```

### 4.3 Update Process

**Update Stack**:
```bash
# Validate changes
aws cloudformation validate-template \
  --template-body file://database-stack-updated.yaml \
  --region ap-northeast-2

# Create change set
aws cloudformation create-change-set \
  --stack-name table-order-database-stack \
  --change-set-name table-order-db-update-$(date +%Y%m%d-%H%M%S) \
  --template-body file://database-stack-updated.yaml \
  --parameters ParameterKey=AdminEmail,ParameterValue=admin@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-northeast-2

# Review change set
aws cloudformation describe-change-set \
  --change-set-name <change-set-name> \
  --stack-name table-order-database-stack \
  --region ap-northeast-2

# Execute change set (after review)
aws cloudformation execute-change-set \
  --change-set-name <change-set-name> \
  --stack-name table-order-database-stack \
  --region ap-northeast-2
```

### 4.4 Rollback Process

**Automatic Rollback**:
- CloudFormation automatically rolls back on stack creation failure
- All created resources are deleted
- Stack status: ROLLBACK_COMPLETE

**Manual Rollback** (update failure):
```bash
# Cancel update and rollback
aws cloudformation cancel-update-stack \
  --stack-name table-order-database-stack \
  --region ap-northeast-2

# Or use previous version of template
aws cloudformation update-stack \
  --stack-name table-order-database-stack \
  --template-body file://database-stack-previous-version.yaml \
  --parameters ParameterKey=AdminEmail,ParameterValue=admin@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-northeast-2
```

---

## 5. Operational Procedures

### 5.1 Daily Operations

**Health Check**:
```bash
# Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier table-order-db \
  --region ap-northeast-2 \
  --query 'DBInstances[0].[DBInstanceStatus,DBInstanceClass,AllocatedStorage,StorageEncrypted]' \
  --output table

# Check recent CloudWatch alarms
aws cloudwatch describe-alarms \
  --state-value ALARM \
  --alarm-name-prefix TableOrder-RDS \
  --region ap-northeast-2
```

**Performance Monitoring**:
```bash
# View CloudWatch Dashboard
open https://console.aws.amazon.com/cloudwatch/home?region=ap-northeast-2#dashboards:name=TableOrder-Database

# Or query metrics via CLI
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=table-order-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region ap-northeast-2
```

### 5.2 Backup and Recovery Operations

**Manual Backup**:
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier table-order-db \
  --db-snapshot-identifier table-order-db-manual-$(date +%Y%m%d-%H%M%S) \
  --tags Key=Type,Value=Manual Key=Purpose,Value=Pre-Migration \
  --region ap-northeast-2

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier table-order-db \
  --region ap-northeast-2 \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime,Status]' \
  --output table
```

**Point-in-Time Recovery**:
```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier table-order-db \
  --target-db-instance-identifier table-order-db-recovered \
  --restore-time 2026-04-06T10:30:00Z \
  --db-instance-class db.t3.medium \
  --db-subnet-group-name table-order-db-subnet-group \
  --vpc-security-group-ids <database-sg-id> \
  --region ap-northeast-2

# Wait for restore
aws rds wait db-instance-available \
  --db-instance-identifier table-order-db-recovered \
  --region ap-northeast-2
```

**Snapshot Restore**:
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier table-order-db-recovered \
  --db-snapshot-identifier <snapshot-id> \
  --db-instance-class db.t3.medium \
  --db-subnet-group-name table-order-db-subnet-group \
  --vpc-security-group-ids <database-sg-id> \
  --region ap-northeast-2
```

### 5.3 Maintenance Operations

**Apply Maintenance Updates**:
```bash
# View pending maintenance
aws rds describe-pending-maintenance-actions \
  --resource-identifier arn:aws:rds:ap-northeast-2:ACCOUNT_ID:db:table-order-db \
  --region ap-northeast-2

# Apply immediately (or wait for maintenance window)
aws rds apply-pending-maintenance-action \
  --resource-identifier arn:aws:rds:ap-northeast-2:ACCOUNT_ID:db:table-order-db \
  --apply-action system-update \
  --opt-in-type immediate \
  --region ap-northeast-2
```

**Modify Instance**:
```bash
# Scale up instance (e.g., t3.medium → t3.large)
aws rds modify-db-instance \
  --db-instance-identifier table-order-db \
  --db-instance-class db.t3.large \
  --apply-immediately \
  --region ap-northeast-2

# Or use --no-apply-immediately to apply during maintenance window
```

### 5.4 Security Operations

**Rotate Password** (manual, MVP):
```bash
# Generate new password
NEW_PASSWORD=$(openssl rand -base64 32)

# Update secret in Secrets Manager
aws secretsmanager update-secret \
  --secret-id table-order-database-credentials \
  --secret-string "{\"username\":\"table_order_app\",\"password\":\"$NEW_PASSWORD\",\"engine\":\"postgres\",\"host\":\"<endpoint>\",\"port\":5432,\"dbname\":\"table_order_db\"}" \
  --region ap-northeast-2

# Update RDS master password
aws rds modify-db-instance \
  --db-instance-identifier table-order-db \
  --master-user-password "$NEW_PASSWORD" \
  --apply-immediately \
  --region ap-northeast-2
```

**Review Security Group Rules**:
```bash
# Get Database Security Group ID
DB_SG_ID=$(aws cloudformation describe-stacks \
  --stack-name table-order-database-stack \
  --region ap-northeast-2 \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecurityGroupId`].OutputValue' \
  --output text)

# Describe security group rules
aws ec2 describe-security-groups \
  --group-ids $DB_SG_ID \
  --region ap-northeast-2 \
  --query 'SecurityGroups[0].[GroupId,IpPermissions]' \
  --output json
```

### 5.5 Monitoring and Alerting Operations

**Test Alarm**:
```bash
# Set alarm to ALARM state (test only)
aws cloudwatch set-alarm-state \
  --alarm-name TableOrder-RDS-CPU-High \
  --state-value ALARM \
  --state-reason "Testing alarm notification" \
  --region ap-northeast-2

# Check if notification was received
```

**View Alarm History**:
```bash
aws cloudwatch describe-alarm-history \
  --alarm-name TableOrder-RDS-CPU-High \
  --start-date $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --region ap-northeast-2
```

### 5.6 Troubleshooting Procedures

**Connection Issues**:
```bash
# 1. Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier table-order-db \
  --region ap-northeast-2 \
  --query 'DBInstances[0].DBInstanceStatus'

# 2. Check security group rules
aws ec2 describe-security-groups --group-ids <db-sg-id> --region ap-northeast-2

# 3. Test from Backend EC2 (with psql installed)
psql "postgresql://table_order_app:PASSWORD@<endpoint>:5432/table_order_db?sslmode=require" -c "SELECT 1;"

# 4. Check CloudWatch Logs for errors
aws logs tail /aws/rds/instance/table-order-db/postgresql --follow --region ap-northeast-2
```

**Performance Issues**:
```bash
# 1. Check CPU and memory metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=table-order-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2

# 2. Check database connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=table-order-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2

# 3. Enable slow query logging (if needed)
aws rds modify-db-parameter-group \
  --db-parameter-group-name table-order-postgres14-params \
  --parameters "ParameterName=log_min_duration_statement,ParameterValue=500,ApplyMethod=immediate" \
  --region ap-northeast-2

# 4. Query slow queries from logs (after enabling)
aws logs filter-log-events \
  --log-group-name /aws/rds/instance/table-order-db/postgresql \
  --filter-pattern "duration" \
  --region ap-northeast-2
```

---

## 6. Disaster Recovery Procedures

### 6.1 DR Scenario Matrix

| Scenario | Impact | Recovery Method | RTO | RPO |
|----------|--------|-----------------|-----|-----|
| **Accidental table drop** | Data loss in specific table | Point-in-time recovery | 30 min | 5 min |
| **Database corruption** | Entire database affected | Restore from latest snapshot | 30 min | Last backup (max 24h) |
| **Security incident** | Credentials compromised | Rotate passwords, audit logs | 15 min | 0 (no data loss) |
| **AZ failure** | Single-AZ down | Manual failover to snapshot in another AZ | 30 min | 5 min (PITR) |
| **Region failure** | Region unavailable | ❌ Not supported (MVP) | N/A | N/A |

### 6.2 DR Runbook

**DR Scenario 1: Accidental Data Deletion**

```bash
# Step 1: Identify the time of deletion
# (From application logs or user report)
DELETION_TIME="2026-04-06T10:30:00Z"

# Step 2: Restore to point before deletion
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier table-order-db \
  --target-db-instance-identifier table-order-db-recovered \
  --restore-time $DELETION_TIME \
  --db-instance-class db.t3.medium \
  --db-subnet-group-name table-order-db-subnet-group \
  --vpc-security-group-ids <database-sg-id> \
  --region ap-northeast-2

# Step 3: Wait for restore to complete (10-15 minutes)
aws rds wait db-instance-available \
  --db-instance-identifier table-order-db-recovered \
  --region ap-northeast-2

# Step 4: Extract missing data from recovered database
psql "postgresql://...:table-order-db-recovered..." \
  -c "COPY (SELECT * FROM orders WHERE created_at >= '<deletion_time>') TO STDOUT WITH CSV HEADER" \
  > recovered_orders.csv

# Step 5: Import data into production database
psql "postgresql://...:table-order-db..." \
  -c "\COPY orders FROM 'recovered_orders.csv' WITH CSV HEADER"

# Step 6: Verify data recovery
psql "postgresql://...:table-order-db..." \
  -c "SELECT COUNT(*) FROM orders WHERE created_at >= '<deletion_time>';"

# Step 7: Delete recovered instance (no longer needed)
aws rds delete-db-instance \
  --db-instance-identifier table-order-db-recovered \
  --skip-final-snapshot \
  --region ap-northeast-2
```

**DR Scenario 2: Database Corruption**

```bash
# Step 1: Identify latest valid snapshot
aws rds describe-db-snapshots \
  --db-instance-identifier table-order-db \
  --region ap-northeast-2 \
  --query 'DBSnapshots[?Status==`available`].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# Step 2: Create final snapshot of corrupted database (for forensics)
aws rds create-db-snapshot \
  --db-instance-identifier table-order-db \
  --db-snapshot-identifier table-order-db-corrupted-$(date +%Y%m%d-%H%M%S) \
  --region ap-northeast-2

# Step 3: Rename production instance (backup)
aws rds modify-db-instance \
  --db-instance-identifier table-order-db \
  --new-db-instance-identifier table-order-db-old \
  --apply-immediately \
  --region ap-northeast-2

# Step 4: Restore from latest snapshot with original name
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier table-order-db \
  --db-snapshot-identifier <latest-snapshot-id> \
  --db-instance-class db.t3.medium \
  --db-subnet-group-name table-order-db-subnet-group \
  --vpc-security-group-ids <database-sg-id> \
  --region ap-northeast-2

# Step 5: Wait for restore
aws rds wait db-instance-available \
  --db-instance-identifier table-order-db \
  --region ap-northeast-2

# Step 6: Test application connectivity
curl http://<backend-endpoint>/health

# Step 7: If successful, delete old corrupted instance
aws rds delete-db-instance \
  --db-instance-identifier table-order-db-old \
  --final-db-snapshot-identifier table-order-db-old-final \
  --region ap-northeast-2
```

---

## 7. CI/CD Integration (Future)

### 7.1 GitOps Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                   GitOps Deployment Pipeline                    │
└────────────────────────────────────────────────────────────────┘

1. Developer commits infrastructure changes:
   Git Repository (database-stack.yaml)
         │
         ▼
   GitHub/GitLab (main branch)

2. CI/CD Pipeline triggers:
   GitHub Actions / GitLab CI / Jenkins
         │
         ├──> Lint CloudFormation template
         │
         ├──> Run cfn-lint
         │
         ├──> Validate template (aws cloudformation validate-template)
         │
         └──> Create change set

3. Manual approval:
   Review change set → Approve

4. Deploy changes:
   Execute change set → Update stack

5. Post-deployment:
   Run smoke tests → Notify team
```

### 7.2 GitHub Actions Example

```yaml
# .github/workflows/database-deploy.yml
name: Deploy Database Infrastructure

on:
  push:
    branches:
      - main
    paths:
      - 'infrastructure/database-stack.yaml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
      
      - name: Lint CloudFormation template
        run: |
          pip install cfn-lint
          cfn-lint infrastructure/database-stack.yaml
      
      - name: Validate template
        run: |
          aws cloudformation validate-template \
            --template-body file://infrastructure/database-stack.yaml
      
      - name: Create change set
        run: |
          aws cloudformation create-change-set \
            --stack-name table-order-database-stack \
            --change-set-name deploy-$(date +%Y%m%d-%H%M%S) \
            --template-body file://infrastructure/database-stack.yaml \
            --parameters ParameterKey=AdminEmail,ParameterValue=${{ secrets.ADMIN_EMAIL }} \
            --capabilities CAPABILITY_NAMED_IAM
      
      # Manual approval required before execution
      - name: Wait for approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ github.TOKEN }}
          approvers: team-leads
      
      - name: Execute change set
        run: |
          aws cloudformation execute-change-set \
            --change-set-name <change-set-name> \
            --stack-name table-order-database-stack
```

---

## Summary

| Component | Configuration | Details |
|-----------|---------------|---------|
| **Architecture** | 3-tier (Public/Application/Data zones) | VPC with private subnets for database |
| **Network** | VPC 10.0.0.0/16, 2 private subnets | Fully isolated database network |
| **Security** | 7-layer defense | VPC, Subnets, SG, IAM, TLS, KMS, Secrets Manager |
| **Deployment** | CloudFormation (IaC) | Single stack, ~29 resources, 20-25 min deployment |
| **Operations** | AWS CLI + Console | Health checks, backups, monitoring, troubleshooting |
| **DR** | PITR + Snapshots | RTO: 30 min, RPO: 5 min |
| **CI/CD** | Future (GitHub Actions) | GitOps workflow with manual approval |

**Deployment Time**: 20-25 minutes  
**Recovery Time**: 30 minutes (automated procedures)  
**Management**: AWS CLI, AWS Console, Infrastructure as Code
