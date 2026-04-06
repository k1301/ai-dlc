/**
 * Seed: menus table
 * Purpose: Insert sample menu item data (3 items per category)
 */

exports.seed = async function(knex) {
  // Delete existing entries
  await knex('menus').del();

  // Insert seed entries
  await knex('menus').insert([
    // Category 1: 메인 요리
    {
      id: 1,
      category_id: 1,
      menu_name: '김치찌개',
      description: '돼지고기와 김치로 만든 얼큰한 찌개',
      price: 9000.00,
      image_url: null,
      is_available: true,
      display_order: 1,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 2,
      category_id: 1,
      menu_name: '된장찌개',
      description: '구수한 된장으로 만든 찌개',
      price: 8000.00,
      image_url: null,
      is_available: true,
      display_order: 2,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 3,
      category_id: 1,
      menu_name: '불고기',
      description: '달콤한 양념에 재운 소고기 볶음',
      price: 15000.00,
      image_url: null,
      is_available: true,
      display_order: 3,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },

    // Category 2: 사이드 메뉴
    {
      id: 4,
      category_id: 2,
      menu_name: '계란말이',
      description: '부드러운 계란말이',
      price: 5000.00,
      image_url: null,
      is_available: true,
      display_order: 1,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 5,
      category_id: 2,
      menu_name: '김치전',
      description: '바삭한 김치전',
      price: 6000.00,
      image_url: null,
      is_available: true,
      display_order: 2,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 6,
      category_id: 2,
      menu_name: '감자튀김',
      description: '바삭한 감자튀김',
      price: 4000.00,
      image_url: null,
      is_available: true,
      display_order: 3,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },

    // Category 3: 음료
    {
      id: 7,
      category_id: 3,
      menu_name: '콜라',
      description: '시원한 콜라',
      price: 2000.00,
      image_url: null,
      is_available: true,
      display_order: 1,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 8,
      category_id: 3,
      menu_name: '사이다',
      description: '시원한 사이다',
      price: 2000.00,
      image_url: null,
      is_available: true,
      display_order: 2,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 9,
      category_id: 3,
      menu_name: '오렌지 주스',
      description: '신선한 오렌지 주스',
      price: 3000.00,
      image_url: null,
      is_available: true,
      display_order: 3,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },

    // Category 4: 주류
    {
      id: 10,
      category_id: 4,
      menu_name: '소주',
      description: '참이슬',
      price: 4500.00,
      image_url: null,
      is_available: true,
      display_order: 1,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 11,
      category_id: 4,
      menu_name: '맥주',
      description: '생맥주',
      price: 4000.00,
      image_url: null,
      is_available: true,
      display_order: 2,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 12,
      category_id: 4,
      menu_name: '막걸리',
      description: '전통 막걸리',
      price: 5000.00,
      image_url: null,
      is_available: true,
      display_order: 3,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },

    // Category 5: 디저트
    {
      id: 13,
      category_id: 5,
      menu_name: '아이스크림',
      description: '바닐라 아이스크림',
      price: 3000.00,
      image_url: null,
      is_available: true,
      display_order: 1,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 14,
      category_id: 5,
      menu_name: '과일',
      description: '제철 과일',
      price: 5000.00,
      image_url: null,
      is_available: true,
      display_order: 2,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: 15,
      category_id: 5,
      menu_name: '케이크',
      description: '초콜릿 케이크',
      price: 6000.00,
      image_url: null,
      is_available: true,
      display_order: 3,
      deleted_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  // Reset sequence (PostgreSQL)
  await knex.raw("SELECT setval('menus_id_seq', (SELECT MAX(id) FROM menus))");
};
