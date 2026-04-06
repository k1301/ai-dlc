# Database Infrastructure Design

## Overview

이 문서는 Database unit의 논리 컴포넌트를 실제 AWS 인프라로 매핑한 infrastructure design을 정의합니다.

**Target Region**: ap-northeast-2 (Seoul)  
**Deployment Method**: AWS CloudFormation  
**Environment**: Single (Production only)  
**IaC Version Control**: Git repository

---

## 1. AWS Service Mappings

논리 컴포넌트를 AWS 서비스로 매핑합니다.

| Logical Component | AWS Service | Resource Type | Purpose |
|-------------------|-------------|---------------|---------|
| **RDS Instance** | Amazon RDS | `AWS::RDS::DBInstance` | PostgreSQL 14 데이터베이스 |
| **Parameter Group** | Amazon RDS | `AWS::RDS::DBParameterGroup` | PostgreSQL 설정 관리 |
| **Subnet Group** | Amazon RDS | `AWS::RDS::DBSubnetGroup` | Multi-AZ subnet 그룹 |
| **CloudWatch Alarms** | Amazon CloudWatch | `AWS::CloudWatch::Alarm` | 메트릭 임계값 모니터링 |
| **CloudWatch Dashboard** | Amazon CloudWatch | `AWS::CloudWatch::Dashboard` | 메트릭 시각화 |
| **CloudWatch Logs** | Amazon CloudWatch Logs | `AWS::Logs::LogGroup` | 로그 수집 및 보관 |
| **SNS Topic** | Amazon SNS | `AWS::SNS::Topic` | 알림 전송 |
| **KMS Key** | AWS KMS | `AWS::KMS::Key` | 데이터 암호화 키 |
| **Secrets Manager** | AWS Secrets Manager | `AWS::SecretsManager::Secret` | 자격 증명 관리 |
| **VPC** | Amazon VPC | `AWS::EC2::VPC` | 네트워크 격리 |
| **Private Subnets** | Amazon VPC | `AWS::EC2::Subnet` | Private 서브넷 (2개 AZ) |
| **Security Group** | Amazon VPC | `AWS::EC2::SecurityGroup` | 네트워크 접근 제어 |
| **Route Table** | Amazon VPC | `AWS::EC2::RouteTable` | 라우팅 규칙 |
| **IAM Role** | AWS IAM | `AWS::IAM::Role` | EC2 인스턴스 프로필 |

**Total Resources**: 14+ CloudFormation resources

---

## 2. VPC and Network Configuration

### 2.1 VPC Design

**VPC CIDR**: `10.0.0.0/16` (65,536 IP addresses)

```yaml
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16
    EnableDnsHostnames: true
    EnableDnsSupport: true
    Tags:
      - Key: Name
        Value: table-order-vpc
      - Key: Environment
        Value: Production
      - Key: Application
        Value: TableOrder
      - Key: ManagedBy
        Value: CloudFormation
```

### 2.2 Subnet Design

**2 Private Subnets** (for RDS Multi-AZ subnet group requirement):

| Subnet | CIDR | AZ | IP Count | Usage |
|--------|------|----|----|-------|
| Private Subnet 1 | 10.0.1.0/24 | ap-northeast-2a | 256 | RDS Primary (Single-AZ, but in subnet group) |
| Private Subnet 2 | 10.0.2.0/24 | ap-northeast-2b | 256 | RDS Subnet Group (required) |

**Note**: Backend will use additional subnets (to be defined in Backend Infrastructure Design).

```yaml
PrivateSubnet1:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref VPC
    CidrBlock: 10.0.1.0/24
    AvailabilityZone: ap-northeast-2a
    MapPublicIpOnLaunch: false
    Tags:
      - Key: Name
        Value: table-order-private-subnet-1
      - Key: Type
        Value: Private
      - Key: Environment
        Value: Production

PrivateSubnet2:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref VPC
    CidrBlock: 10.0.2.0/24
    AvailabilityZone: ap-northeast-2b
    MapPublicIpOnLaunch: false
    Tags:
      - Key: Name
        Value: table-order-private-subnet-2
      - Key: Type
        Value: Private
      - Key: Environment
        Value: Production
```

### 2.3 Route Tables

**Private Route Table** (no internet gateway, internal traffic only):

```yaml
PrivateRouteTable:
  Type: AWS::EC2::RouteTable
  Properties:
    VpcId: !Ref VPC
    Tags:
      - Key: Name
        Value: table-order-private-rt
      - Key: Environment
        Value: Production

PrivateSubnet1RouteTableAssociation:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId: !Ref PrivateSubnet1
    RouteTableId: !Ref PrivateRouteTable

PrivateSubnet2RouteTableAssociation:
  Type: AWS::EC2::SubnetRouteTableAssociation
  Properties:
    SubnetId: !Ref PrivateSubnet2
    RouteTableId: !Ref PrivateRouteTable
```

**Note**: No internet gateway or NAT gateway attached (database is fully private).

### 2.4 Network Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                 VPC: 10.0.0.0/16                                │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐   │
│  │  Private Subnet 1        │  │  Private Subnet 2        │   │
│  │  10.0.1.0/24             │  │  10.0.2.0/24             │   │
│  │  AZ: ap-northeast-2a     │  │  AZ: ap-northeast-2b     │   │
│  │                          │  │                          │   │
│  │  ┌──────────────────┐    │  │                          │   │
│  │  │  RDS Instance    │    │  │  (Subnet for DB subnet   │   │
│  │  │  (Single-AZ)     │    │  │   group requirement)     │   │
│  │  │  PostgreSQL 14   │    │  │                          │   │
│  │  │  db.t3.medium    │    │  │                          │   │
│  │  └──────────────────┘    │  │                          │   │
│  │                          │  │                          │   │
│  └──────────────────────────┘  └──────────────────────────┘   │
│             │                            │                     │
│             └────────────────────────────┘                     │
│                          │                                     │
│                ┌─────────▼─────────┐                           │
│                │  DB Subnet Group  │                           │
│                └───────────────────┘                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Security Group (Database-SG)                        │     │
│  │  Inbound: Port 5432 from Backend-SG                  │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                         │ (Private connection only)
                         │
                         ▼
              ┌──────────────────┐
              │  Backend EC2     │
              │  (in same VPC,   │
              │   different SN)  │
              └──────────────────┘
```

---

## 3. RDS Instance Configuration

### 3.1 RDS Database Instance

```yaml
DBInstance:
  Type: AWS::RDS::DBInstance
  Properties:
    # Engine
    Engine: postgres
    EngineVersion: "14.10"
    DBInstanceIdentifier: table-order-db
    DBName: table_order_db
    
    # Instance
    DBInstanceClass: db.t3.medium
    AllocatedStorage: 20
    MaxAllocatedStorage: 100
    StorageType: gp3
    StorageEncrypted: true
    KmsKeyId: !GetAtt DatabaseKMSKey.Arn
    
    # Network
    DBSubnetGroupName: !Ref DBSubnetGroup
    VPCSecurityGroups:
      - !Ref DatabaseSecurityGroup
    PubliclyAccessible: false
    AvailabilityZone: ap-northeast-2a
    MultiAZ: false
    
    # Credentials
    MasterUsername: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}'
    MasterUserPassword: !Sub '{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}'
    
    # Backup
    BackupRetentionPeriod: 7
    PreferredBackupWindow: "18:00-19:00" # UTC (KST 03:00-04:00)
    CopyTagsToSnapshot: true
    DeleteAutomatedBackups: false
    DeletionProtection: true
    
    # Maintenance
    PreferredMaintenanceWindow: "mon:17:00-mon:19:00" # UTC (KST Tue 02:00-04:00)
    AutoMinorVersionUpgrade: true
    AllowMajorVersionUpgrade: false
    
    # Monitoring
    MonitoringInterval: 0 # Enhanced Monitoring disabled
    EnableCloudwatchLogsExports:
      - postgresql
    
    # Parameter Group
    DBParameterGroupName: !Ref DBParameterGroup
    
    # Performance Insights
    EnablePerformanceInsights: false
    
    # Tags
    Tags:
      - Key: Name
        Value: table-order-db
      - Key: Environment
        Value: Production
      - Key: Application
        Value: TableOrder
      - Key: ManagedBy
        Value: CloudFormation

# Final Snapshot on Deletion
# Note: DeletionPolicy in CloudFormation
  DeletionPolicy: Snapshot
  UpdateReplacePolicy: Snapshot
```

### 3.2 DB Subnet Group

```yaml
DBSubnetGroup:
  Type: AWS::RDS::DBSubnetGroup
  Properties:
    DBSubnetGroupName: table-order-db-subnet-group
    DBSubnetGroupDescription: Subnet group for Table Order PostgreSQL database
    SubnetIds:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    Tags:
      - Key: Name
        Value: table-order-db-subnet-group
      - Key: Environment
        Value: Production
      - Key: Application
        Value: TableOrder
```

### 3.3 DB Parameter Group

```yaml
DBParameterGroup:
  Type: AWS::RDS::DBParameterGroup
  Properties:
    DBParameterGroupName: table-order-postgres14-params
    Description: Custom parameter group for Table Order PostgreSQL 14
    Family: postgres14
    Parameters:
      # Connection
      max_connections: "100"
      
      # Memory (default values for t3.medium: 4GB RAM)
      shared_buffers: "{DBInstanceClassMemory/32768}" # ~1GB (25% of RAM)
      work_mem: "4096" # 4MB
      maintenance_work_mem: "65536" # 64MB
      effective_cache_size: "{DBInstanceClassMemory*3/4096}" # ~3GB (75% of RAM)
      
      # Query Planner
      random_page_cost: "1.1" # SSD optimization
      effective_io_concurrency: "200" # SSD concurrency
      
      # Logging (MVP - minimal)
      log_statement: "none" # Don't log statements
      log_min_duration_statement: "-1" # Slow query logging disabled
      log_connections: "0"
      log_disconnections: "0"
      log_min_error_statement: "error" # Log errors only
      
      # Timezone
      timezone: "Asia/Seoul"
      
      # Auto Vacuum
      autovacuum: "1"
      
      # Checkpoint
      checkpoint_timeout: "300" # 5 minutes
      checkpoint_completion_target: "0.9"
    
    Tags:
      - Key: Name
        Value: table-order-postgres14-params
      - Key: Environment
        Value: Production
```

### 3.4 RDS Endpoint

**Output**:
- **Endpoint**: `table-order-db.xxxxxx.ap-northeast-2.rds.amazonaws.com`
- **Port**: `5432`
- **Database**: `table_order_db`

**Connection String** (stored in Secrets Manager):
```
postgresql://table_order_app:password@table-order-db.xxxxxx.ap-northeast-2.rds.amazonaws.com:5432/table_order_db?sslmode=require
```

---

## 4. Security Configuration

### 4.1 KMS Key for Encryption at Rest

```yaml
DatabaseKMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS key for Table Order database encryption at rest
    KeyPolicy:
      Version: "2012-10-17"
      Statement:
        # Root account full access
        - Sid: Enable IAM User Permissions
          Effect: Allow
          Principal:
            AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
          Action: "kms:*"
          Resource: "*"
        
        # RDS service access
        - Sid: Allow RDS to use the key
          Effect: Allow
          Principal:
            Service: rds.amazonaws.com
          Action:
            - "kms:Decrypt"
            - "kms:GenerateDataKey"
            - "kms:CreateGrant"
          Resource: "*"
          Condition:
            StringEquals:
              "kms:ViaService": !Sub "rds.${AWS::Region}.amazonaws.com"
        
        # CloudWatch Logs access
        - Sid: Allow CloudWatch Logs to use the key
          Effect: Allow
          Principal:
            Service: logs.amazonaws.com
          Action:
            - "kms:Encrypt"
            - "kms:Decrypt"
            - "kms:ReEncrypt*"
            - "kms:GenerateDataKey*"
            - "kms:CreateGrant"
            - "kms:DescribeKey"
          Resource: "*"
          Condition:
            ArnLike:
              "kms:EncryptionContext:aws:logs:arn": !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
    
    EnableKeyRotation: true
    
    Tags:
      - Key: Name
        Value: table-order-database-key
      - Key: Environment
        Value: Production
      - Key: Application
        Value: TableOrder

DatabaseKMSKeyAlias:
  Type: AWS::KMS::Alias
  Properties:
    AliasName: alias/table-order-database
    TargetKeyId: !Ref DatabaseKMSKey
```

### 4.2 Secrets Manager for Credentials

```yaml
DatabaseSecret:
  Type: AWS::SecretsManager::Secret
  Properties:
    Name: table-order-database-credentials
    Description: Database credentials for Table Order application
    GenerateSecretString:
      SecretStringTemplate: |
        {
          "username": "table_order_app",
          "engine": "postgres",
          "host": "",
          "port": 5432,
          "dbname": "table_order_db"
        }
      GenerateStringKey: password
      PasswordLength: 32
      ExcludeCharacters: '"@/\'
      RequireEachIncludedType: true
    
    KmsKeyId: !Ref DatabaseKMSKey
    
    Tags:
      - Key: Name
        Value: table-order-database-credentials
      - Key: Environment
        Value: Production
      - Key: Application
        Value: TableOrder

# Attach secret to RDS instance (updates host after creation)
SecretRDSAttachment:
  Type: AWS::SecretsManager::SecretTargetAttachment
  Properties:
    SecretId: !Ref DatabaseSecret
    TargetId: !Ref DBInstance
    TargetType: AWS::RDS::DBInstance
```

**Secret JSON Structure**:
```json
{
  "username": "table_order_app",
  "password": "<generated-32-char-password>",
  "engine": "postgres",
  "host": "table-order-db.xxxxxx.ap-northeast-2.rds.amazonaws.com",
  "port": 5432,
  "dbname": "table_order_db"
}
```

### 4.3 Security Group for Database

```yaml
DatabaseSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupName: table-order-database-sg
    GroupDescription: Security group for Table Order PostgreSQL database
    VpcId: !Ref VPC
    
    SecurityGroupIngress:
      # PostgreSQL from Backend Security Group only
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        SourceSecurityGroupId: !Ref BackendSecurityGroup
        Description: PostgreSQL access from backend application
    
    SecurityGroupEgress:
      # Allow all outbound (for updates, not actively used)
      - IpProtocol: -1
        CidrIp: 0.0.0.0/0
        Description: Allow all outbound traffic
    
    Tags:
      - Key: Name
        Value: table-order-database-sg
      - Key: Environment
        Value: Production
      - Key: Application
        Value: TableOrder
```

**Security Rules Summary**:
- **Inbound**: Port 5432 from Backend Security Group only
- **Outbound**: All traffic (not actively used, but allows RDS management traffic)

### 4.4 IAM Role for Backend EC2

```yaml
BackendEC2Role:
  Type: AWS::IAM::Role
  Properties:
    RoleName: table-order-backend-ec2-role
    AssumeRolePolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal:
            Service: ec2.amazonaws.com
          Action: "sts:AssumeRole"
    
    ManagedPolicyArns:
      - "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    
    Policies:
      # Secrets Manager access
      - PolicyName: SecretsManagerAccess
        PolicyDocument:
          Version: "2012-10-17"
          Statement:
            - Effect: Allow
              Action:
                - "secretsmanager:GetSecretValue"
                - "secretsmanager:DescribeSecret"
              Resource: !Ref DatabaseSecret
      
      # KMS access for decryption
      - PolicyName: KMSDecryptAccess
        PolicyDocument:
          Version: "2012-10-17"
          Statement:
            - Effect: Allow
              Action:
                - "kms:Decrypt"
                - "kms:DescribeKey"
              Resource: !GetAtt DatabaseKMSKey.Arn
    
    Tags:
      - Key: Name
        Value: table-order-backend-ec2-role
      - Key: Environment
        Value: Production
      - Key: Application
        Value: TableOrder

BackendEC2InstanceProfile:
  Type: AWS::IAM::InstanceProfile
  Properties:
    InstanceProfileName: table-order-backend-ec2-profile
    Roles:
      - !Ref BackendEC2Role
```

---

## 5. Monitoring Configuration

### 5.1 CloudWatch Log Group

```yaml
DatabaseLogGroup:
  Type: AWS::Logs::LogGroup
  Properties:
    LogGroupName: /aws/rds/instance/table-order-db/postgresql
    RetentionInDays: 30
    KmsKeyId: !GetAtt DatabaseKMSKey.Arn
    Tags:
      - Key: Name
        Value: table-order-database-logs
      - Key: Environment
        Value: Production
      - Key: Application
        Value: TableOrder
```

### 5.2 SNS Topic for Alarms

```yaml
DatabaseAlarmTopic:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: table-order-database-alarms
    DisplayName: Table Order Database Alarms
    Subscription:
      - Protocol: email
        Endpoint: admin@example.com # TODO: Replace with actual email
    
    Tags:
      - Key: Name
        Value: table-order-database-alarms
      - Key: Environment
        Value: Production
      - Key: Application
        Value: TableOrder

DatabaseAlarmTopicPolicy:
  Type: AWS::SNS::TopicPolicy
  Properties:
    Topics:
      - !Ref DatabaseAlarmTopic
    PolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal:
            Service: cloudwatch.amazonaws.com
          Action: "SNS:Publish"
          Resource: !Ref DatabaseAlarmTopic
```

### 5.3 CloudWatch Alarms

```yaml
# CPU Utilization Alarm
DatabaseCPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: TableOrder-RDS-CPU-High
    AlarmDescription: Alert when RDS CPU utilization exceeds 80%
    MetricName: CPUUtilization
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80.0
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic
    TreatMissingData: notBreaching

# Database Connections Alarm
DatabaseConnectionsAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: TableOrder-RDS-Connections-High
    AlarmDescription: Alert when database connections exceed 80% (16 of 20)
    MetricName: DatabaseConnections
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 16.0
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic

# Free Storage Space Alarm
DatabaseStorageAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: TableOrder-RDS-Storage-Low
    AlarmDescription: Alert when free storage drops below 20% (4GB)
    MetricName: FreeStorageSpace
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 1
    Threshold: 4294967296 # 4GB in bytes
    ComparisonOperator: LessThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic

# Freeable Memory Alarm
DatabaseMemoryAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: TableOrder-RDS-Memory-Low
    AlarmDescription: Alert when freeable memory drops below 500MB
    MetricName: FreeableMemory
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 524288000 # 500MB in bytes
    ComparisonOperator: LessThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic

# Read Latency Alarm
DatabaseReadLatencyAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: TableOrder-RDS-ReadLatency-High
    AlarmDescription: Alert when read latency exceeds 100ms
    MetricName: ReadLatency
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 0.1 # 100ms in seconds
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic

# Write Latency Alarm
DatabaseWriteLatencyAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: TableOrder-RDS-WriteLatency-High
    AlarmDescription: Alert when write latency exceeds 100ms
    MetricName: WriteLatency
    Namespace: AWS/RDS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 0.1 # 100ms in seconds
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: DBInstanceIdentifier
        Value: !Ref DBInstance
    AlarmActions:
      - !Ref DatabaseAlarmTopic
```

### 5.4 CloudWatch Dashboard

```yaml
DatabaseDashboard:
  Type: AWS::CloudWatch::Dashboard
  Properties:
    DashboardName: TableOrder-Database
    DashboardBody: !Sub |
      {
        "widgets": [
          {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "title": "CPU Utilization (%)",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "CPUUtilization", {"stat": "Average", "period": 300}]
              ],
              "view": "timeSeries",
              "stacked": false,
              "yAxis": {"left": {"min": 0, "max": 100}},
              "annotations": {
                "horizontal": [
                  {"value": 80, "label": "Alarm Threshold", "fill": "above"}
                ]
              }
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
              "title": "Database Connections",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "DatabaseConnections", {"stat": "Average", "period": 300}]
              ],
              "view": "timeSeries",
              "yAxis": {"left": {"min": 0, "max": 20}},
              "annotations": {
                "horizontal": [
                  {"value": 16, "label": "Alarm Threshold", "fill": "above"}
                ]
              }
            }
          },
          {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
              "title": "Free Storage Space (GB)",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "FreeStorageSpace", {"stat": "Average", "period": 300}]
              ],
              "view": "timeSeries",
              "annotations": {
                "horizontal": [
                  {"value": 4294967296, "label": "Alarm Threshold (4GB)", "fill": "below"}
                ]
              }
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
              "title": "Read/Write Latency (ms)",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "ReadLatency", {"stat": "Average", "period": 300, "label": "Read"}],
                [".", "WriteLatency", {"stat": "Average", "period": 300, "label": "Write"}]
              ],
              "view": "timeSeries",
              "yAxis": {"left": {"min": 0}},
              "annotations": {
                "horizontal": [
                  {"value": 0.1, "label": "Alarm Threshold (100ms)", "fill": "above"}
                ]
              }
            }
          },
          {
            "type": "metric",
            "x": 0,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
              "title": "IOPS (Read/Write)",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "ReadIOPS", {"stat": "Average", "period": 300, "label": "Read"}],
                [".", "WriteIOPS", {"stat": "Average", "period": 300, "label": "Write"}]
              ],
              "view": "timeSeries"
            }
          },
          {
            "type": "metric",
            "x": 12,
            "y": 12,
            "width": 12,
            "height": 6,
            "properties": {
              "title": "Freeable Memory (MB)",
              "region": "${AWS::Region}",
              "metrics": [
                ["AWS/RDS", "FreeableMemory", {"stat": "Average", "period": 300}]
              ],
              "view": "timeSeries",
              "annotations": {
                "horizontal": [
                  {"value": 524288000, "label": "Alarm Threshold (500MB)", "fill": "below"}
                ]
              }
            }
          }
        ]
      }
```

---

## 6. Backup Configuration

### 6.1 Automated Backups

**Configuration** (in RDS DBInstance):
- **Enabled**: Yes (BackupRetentionPeriod: 7)
- **Backup Window**: 18:00-19:00 UTC (KST 03:00-04:00)
- **Retention**: 7 days
- **Point-in-Time Recovery**: Enabled (5-minute granularity)
- **Copy Tags to Snapshot**: Yes
- **Delete Automated Backups**: No (retained after instance deletion)

### 6.2 Final Snapshot on Deletion

**CloudFormation DeletionPolicy**:
```yaml
DBInstance:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: Snapshot
  UpdateReplacePolicy: Snapshot
```

When RDS instance is deleted via CloudFormation stack deletion, a final snapshot is automatically created with name: `table-order-db-final-snapshot-<timestamp>`

### 6.3 Manual Snapshots

**AWS CLI Command**:
```bash
# Create manual snapshot before major changes
aws rds create-db-snapshot \
  --db-instance-identifier table-order-db \
  --db-snapshot-identifier table-order-db-manual-$(date +%Y%m%d-%H%M%S) \
  --tags Key=Type,Value=Manual Key=Purpose,Value=Pre-Migration \
  --region ap-northeast-2
```

---

## 7. CloudFormation Template Structure

### 7.1 Stack Organization

**Single CloudFormation Stack**: `table-order-database-stack`

**Resource Organization**:
1. **Networking** (VPC, Subnets, Route Tables, Security Groups)
2. **Security** (KMS Key, Secrets Manager, IAM Roles)
3. **Database** (RDS Instance, Parameter Group, Subnet Group)
4. **Monitoring** (CloudWatch Alarms, Dashboard, Log Group, SNS Topic)

### 7.2 Template Structure

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: Table Order Database Infrastructure (PostgreSQL 14 on RDS)

# Parameters
Parameters:
  AdminEmail:
    Type: String
    Description: Email address for alarm notifications
    Default: admin@example.com

# Resources
Resources:
  # 1. Networking (10 resources)
  VPC: ...
  PrivateSubnet1: ...
  PrivateSubnet2: ...
  PrivateRouteTable: ...
  PrivateSubnet1RouteTableAssociation: ...
  PrivateSubnet2RouteTableAssociation: ...
  DatabaseSecurityGroup: ...
  BackendSecurityGroup: ... # Placeholder, defined in Backend stack
  
  # 2. Security (6 resources)
  DatabaseKMSKey: ...
  DatabaseKMSKeyAlias: ...
  DatabaseSecret: ...
  SecretRDSAttachment: ...
  BackendEC2Role: ...
  BackendEC2InstanceProfile: ...
  
  # 3. Database (3 resources)
  DBParameterGroup: ...
  DBSubnetGroup: ...
  DBInstance: ...
  
  # 4. Monitoring (10 resources)
  DatabaseLogGroup: ...
  DatabaseAlarmTopic: ...
  DatabaseAlarmTopicPolicy: ...
  DatabaseCPUAlarm: ...
  DatabaseConnectionsAlarm: ...
  DatabaseStorageAlarm: ...
  DatabaseMemoryAlarm: ...
  DatabaseReadLatencyAlarm: ...
  DatabaseWriteLatencyAlarm: ...
  DatabaseDashboard: ...

# Outputs
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"
  
  DatabaseEndpoint:
    Description: RDS database endpoint
    Value: !GetAtt DBInstance.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseEndpoint"
  
  DatabasePort:
    Description: RDS database port
    Value: !GetAtt DBInstance.Endpoint.Port
    Export:
      Name: !Sub "${AWS::StackName}-DatabasePort"
  
  DatabaseName:
    Description: Database name
    Value: table_order_db
  
  DatabaseSecretArn:
    Description: Secrets Manager secret ARN
    Value: !Ref DatabaseSecret
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseSecretArn"
  
  DatabaseSecurityGroupId:
    Description: Database security group ID
    Value: !Ref DatabaseSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseSecurityGroupId"
  
  BackendEC2RoleArn:
    Description: Backend EC2 role ARN
    Value: !GetAtt BackendEC2Role.Arn
    Export:
      Name: !Sub "${AWS::StackName}-BackendEC2RoleArn"
```

### 7.3 Deployment Commands

**Create Stack**:
```bash
aws cloudformation create-stack \
  --stack-name table-order-database-stack \
  --template-body file://database-stack.yaml \
  --parameters ParameterKey=AdminEmail,ParameterValue=admin@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-northeast-2 \
  --tags Key=Environment,Value=Production Key=Application,Value=TableOrder
```

**Update Stack**:
```bash
aws cloudformation update-stack \
  --stack-name table-order-database-stack \
  --template-body file://database-stack.yaml \
  --parameters ParameterKey=AdminEmail,ParameterValue=admin@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-northeast-2
```

**Delete Stack** (with final snapshot):
```bash
aws cloudformation delete-stack \
  --stack-name table-order-database-stack \
  --region ap-northeast-2

# Final snapshot will be created automatically due to DeletionPolicy: Snapshot
```

---

## 8. Cost Estimates

### 8.1 Monthly Cost Breakdown

| Service | Configuration | Monthly Cost (USD) |
|---------|--------------|-------------------|
| **RDS Instance** | db.t3.medium, Single-AZ | ~$52 |
| **Storage (gp3)** | 20GB initial | ~$2.30 |
| **Backup Storage** | 7 days retention, ~20GB | Free (within 100% of DB size) |
| **KMS Key** | 1 key | $1 |
| **Secrets Manager** | 1 secret | ~$0.40 |
| **CloudWatch Logs** | 30 days retention, ~1GB | ~$0.50 |
| **CloudWatch Alarms** | 6 alarms (standard metrics) | Free |
| **SNS** | Email notifications, low volume | ~$0 |
| **Data Transfer** | Within VPC | Free |
| **Total** | | **~$56.20/month** |

**Notes**:
- Storage auto-scaling will increase cost proportionally (up to 100GB = ~$11.50)
- Enhanced Monitoring is disabled to avoid additional cost (~$7/month if enabled)
- Performance Insights is disabled to avoid additional cost (~$7/month if enabled)
- Costs are estimates and may vary based on actual usage

### 8.2 Cost Optimization Opportunities

**Current Optimizations** (already applied):
- ✅ Single-AZ deployment (vs Multi-AZ: saves ~50%)
- ✅ No Read Replica (saves ~$52/month per replica)
- ✅ Basic CloudWatch monitoring (vs Enhanced: saves ~$7/month)
- ✅ No Performance Insights (saves ~$7/month)
- ✅ gp3 storage (vs io1: more cost-effective)

**Future Optimizations** (consider for production):
- Reserved Instance: 1-year commitment saves ~30% (~$18/month savings)
- Reserved Instance: 3-year commitment saves ~50% (~$26/month savings)
- Right-sizing: Monitor actual usage, downgrade to t3.small if underutilized (saves ~$26/month)

---

## 9. Environment Configuration

### 9.1 Single Environment Strategy

**MVP Approach**: Production only

| Environment | RDS Instance | Purpose | Cost |
|-------------|--------------|---------|------|
| **Local** | PostgreSQL Docker | Development | $0 (local) |
| **Production** | db.t3.medium RDS | MVP/Production | ~$56/month |

**Local Development Setup**:
```yaml
# docker-compose.yml for local development
version: "3.8"
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: table_order_app
      POSTGRES_PASSWORD: localpassword
      POSTGRES_DB: table_order_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 9.2 Future Multi-Environment Strategy

**When scaling** (after MVP):

| Environment | RDS Instance | Purpose | Cost |
|-------------|--------------|---------|------|
| **Local** | PostgreSQL Docker | Development | $0 |
| **Dev** | db.t3.small RDS | Shared dev/test | ~$26/month |
| **Staging** | db.t3.medium RDS | Pre-production testing | ~$56/month |
| **Production** | db.t3.medium+ Multi-AZ | Production | ~$104+/month |

---

## 10. Disaster Recovery

### 10.1 DR Strategy

**MVP**: No cross-region backup (Q10 Answer: A)

**Backup Coverage**:
- ✅ Automated daily backups (7 days retention)
- ✅ Point-in-time recovery (5-minute granularity, 7 days)
- ✅ Final snapshot on deletion
- ✅ Manual snapshots (ad-hoc)
- ❌ Cross-region backup (not enabled)

### 10.2 Recovery Procedures

**Scenario 1: Accidental Data Deletion**
```bash
# Restore to point before deletion
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier table-order-db \
  --target-db-instance-identifier table-order-db-recovered \
  --restore-time 2026-04-06T10:30:00Z \
  --region ap-northeast-2
```

**Scenario 2: Database Corruption**
```bash
# Restore from latest automated backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier table-order-db-recovered \
  --db-snapshot-identifier rds:table-order-db-2026-04-06-03-00 \
  --region ap-northeast-2
```

**Scenario 3: Region Failure** (future consideration)
```bash
# Copy snapshot to another region (manual, for major milestones)
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:ap-northeast-2:ACCOUNT_ID:snapshot:table-order-db-manual-20260406 \
  --target-db-snapshot-identifier table-order-db-manual-20260406 \
  --region ap-northeast-1 \
  --source-region ap-northeast-2

# Restore in new region
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier table-order-db-dr \
  --db-snapshot-identifier table-order-db-manual-20260406 \
  --region ap-northeast-1
```

---

## Summary

| Category | Configuration | Details |
|----------|---------------|---------|
| **Region** | ap-northeast-2 (Seoul) | Single region, no DR |
| **VPC** | 10.0.0.0/16 | New VPC, 2 private subnets |
| **RDS** | PostgreSQL 14, db.t3.medium | Single-AZ, 20GB gp3 |
| **Security** | KMS + Secrets Manager + VPC SG | Encryption at-rest/in-transit |
| **Monitoring** | CloudWatch + SNS | 6 alarms, dashboard, logs |
| **Backup** | 7 days retention, PITR | Automated daily backups |
| **IaC** | CloudFormation | Single stack, ~29 resources |
| **Cost** | ~$56/month | Optimized for MVP |
| **Environment** | Production only | Local dev with Docker |

**Deployment Method**: AWS CloudFormation  
**Version Control**: Git repository  
**Tagging Strategy**: Name, Environment, Application, ManagedBy
