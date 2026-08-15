import { AppState, Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // 1. Food & Drinks
  { id: 'cat_food_drinks', nameEn: 'Food & Drinks', nameBg: 'Храна и напитки', type: 'needs', icon: 'Utensils', color: '#F97316' },
  { id: 'cat_bar_cafe', parentId: 'cat_food_drinks', nameEn: 'Bar, cafe', nameBg: 'Бар, кафене', type: 'needs', icon: 'Coffee', color: '#F97316' },
  { id: 'cat_restaurant', parentId: 'cat_food_drinks', nameEn: 'Restaurant, fast-food', nameBg: 'Ресторант, бърза храна', type: 'needs', icon: 'Utensils', color: '#F97316' },
  { id: 'cat_office_food', parentId: 'cat_food_drinks', nameEn: 'Office - food', nameBg: 'Офис - храна', type: 'needs', icon: 'Briefcase', color: '#F97316' },
  { id: 'cat_groceries', parentId: 'cat_food_drinks', nameEn: 'Groceries', nameBg: 'Хранителни стоки', type: 'needs', icon: 'ShoppingBag', color: '#F97316' },

  // 2. Shopping
  { id: 'cat_shopping', nameEn: 'Shopping', nameBg: 'Пазаруване', type: 'wants', icon: 'ShoppingBag', color: '#38BDF8' },
  { id: 'cat_drug_store', parentId: 'cat_shopping', nameEn: 'Drug-store, chemist', nameBg: 'Аптека, дрогерия', type: 'wants', icon: 'Pill', color: '#38BDF8' },
  { id: 'cat_leisure_time', parentId: 'cat_shopping', nameEn: 'Leisure time', nameBg: 'Свободно време', type: 'wants', icon: 'Smile', color: '#38BDF8' },
  { id: 'cat_stationery', parentId: 'cat_shopping', nameEn: 'Stationery, tools', nameBg: 'Канцелария, инструменти', type: 'wants', icon: 'PenTool', color: '#38BDF8' },
  { id: 'cat_gifts', parentId: 'cat_shopping', nameEn: 'Gifts, joy', nameBg: 'Подаръци, радост', type: 'wants', icon: 'Gift', color: '#38BDF8' },
  { id: 'cat_electronics', parentId: 'cat_shopping', nameEn: 'Electronics, accessories', nameBg: 'Електроника, аксесоари', type: 'wants', icon: 'Laptop', color: '#38BDF8' },
  { id: 'cat_pets', parentId: 'cat_shopping', nameEn: 'Pets, animals', nameBg: 'Домашни любимци', type: 'wants', icon: 'Dog', color: '#38BDF8' },
  { id: 'cat_home_garden', parentId: 'cat_shopping', nameEn: 'Home, garden', nameBg: 'Дом, градина', type: 'wants', icon: 'Home', color: '#38BDF8' },
  { id: 'cat_kids', parentId: 'cat_shopping', nameEn: 'Kids', nameBg: 'Деца', type: 'wants', icon: 'Baby', color: '#38BDF8' },
  { id: 'cat_health_beauty', parentId: 'cat_shopping', nameEn: 'Health and beauty', nameBg: 'Здраве и красота', type: 'wants', icon: 'Heart', color: '#38BDF8' },
  { id: 'cat_jewels', parentId: 'cat_shopping', nameEn: 'Jewels, accessories', nameBg: 'Бижута, аксесоари', type: 'wants', icon: 'Gem', color: '#38BDF8' },
  { id: 'cat_clothes_shoes', parentId: 'cat_shopping', nameEn: 'Clothes & Footwear', nameBg: 'Дрехи и обувки', type: 'wants', icon: 'Shirt', color: '#38BDF8' },

  // 3. Housing
  { id: 'cat_housing', nameEn: 'Housing', nameBg: 'Жилище', type: 'bills', icon: 'Home', color: '#FBBF24' },
  { id: 'cat_property_insurance', parentId: 'cat_housing', nameEn: 'Property insurance', nameBg: 'Застраховка на имота', type: 'bills', icon: 'Shield', color: '#FBBF24' },
  { id: 'cat_maintenance', parentId: 'cat_housing', nameEn: 'Maintenance, repairs', nameBg: 'Поддръжка, ремонти', type: 'bills', icon: 'Wrench', color: '#FBBF24' },
  { id: 'cat_services', parentId: 'cat_housing', nameEn: 'Services', nameBg: 'Услуги', type: 'bills', icon: 'Settings', color: '#FBBF24' },
  { id: 'cat_energy', parentId: 'cat_housing', nameEn: 'Energy, utilities', nameBg: 'Енергия, комунални услуги', type: 'bills', icon: 'Zap', color: '#FBBF24' },
  { id: 'cat_mortgage', parentId: 'cat_housing', nameEn: 'Mortgage', nameBg: 'Ипотека', type: 'bills', icon: 'Landmark', color: '#FBBF24' },
  { id: 'cat_rent', parentId: 'cat_housing', nameEn: 'Rent', nameBg: 'Наем', type: 'bills', icon: 'Key', color: '#FBBF24' },

  // 4. Transportation
  { id: 'cat_transportation', nameEn: 'Transportation', nameBg: 'Транспорт', type: 'needs', icon: 'Bus', color: '#94A3B8' },
  { id: 'cat_business_trips', parentId: 'cat_transportation', nameEn: 'Business trips', nameBg: 'Командировки', type: 'needs', icon: 'Briefcase', color: '#94A3B8' },
  { id: 'cat_long_distance', parentId: 'cat_transportation', nameEn: 'Long distance', nameBg: 'Дълги разстояния', type: 'needs', icon: 'Plane', color: '#94A3B8' },
  { id: 'cat_taxi', parentId: 'cat_transportation', nameEn: 'Taxi', nameBg: 'Такси', type: 'needs', icon: 'Car', color: '#94A3B8' },
  { id: 'cat_public_transport', parentId: 'cat_transportation', nameEn: 'Public transport', nameBg: 'Градски транспорт', type: 'needs', icon: 'Bus', color: '#94A3B8' },
  { id: 'cat_vehicle', parentId: 'cat_transportation', nameEn: 'Vehicle', nameBg: 'Превозно средство', type: 'needs', icon: 'Car', color: '#A855F7' },
  { id: 'cat_leasing', parentId: 'cat_transportation', nameEn: 'Leasing', nameBg: 'Лизинг', type: 'needs', icon: 'FileText', color: '#A855F7' },
  { id: 'cat_vehicle_insurance', parentId: 'cat_transportation', nameEn: 'Vehicle insurance', nameBg: 'Автомобилна застраховка', type: 'needs', icon: 'Shield', color: '#A855F7' },
  { id: 'cat_rentals', parentId: 'cat_transportation', nameEn: 'Rentals', nameBg: 'Коли под наем', type: 'needs', icon: 'Key', color: '#A855F7' },
  { id: 'cat_vehicle_maintenance', parentId: 'cat_transportation', nameEn: 'Vehicle maintenance', nameBg: 'Поддръжка на автомобила', type: 'needs', icon: 'Wrench', color: '#A855F7' },
  { id: 'cat_parking', parentId: 'cat_transportation', nameEn: 'Parking', nameBg: 'Паркинг', type: 'needs', icon: 'ParkingCircle', color: '#A855F7' },
  { id: 'cat_fuel', parentId: 'cat_transportation', nameEn: 'Fuel', nameBg: 'Гориво', type: 'needs', icon: 'Fuel', color: '#A855F7' },

  // 5. Life & Entertainment
  { id: 'cat_life_entertainment', nameEn: 'Life & Entertainment', nameBg: 'Живот и забавления', type: 'wants', icon: 'Tv', color: '#84CC16' },
  { id: 'cat_lottery_gambling', parentId: 'cat_life_entertainment', nameEn: 'Lottery, gambling', nameBg: 'Лотария, хазарт', type: 'wants', icon: 'Dices', color: '#84CC16' },
  { id: 'cat_alcohol_tobacco', parentId: 'cat_life_entertainment', nameEn: 'Alcohol, tobacco', nameBg: 'Алкохол, цигари', type: 'wants', icon: 'Wine', color: '#84CC16' },
  { id: 'cat_charity_gifts', parentId: 'cat_life_entertainment', nameEn: 'Charity, gifts', nameBg: 'Благотворителност, подаръци', type: 'wants', icon: 'Heart', color: '#84CC16' },
  { id: 'cat_tithe_10', parentId: 'cat_life_entertainment', nameEn: 'Десятък 10%', nameBg: 'Десятък 10%', type: 'wants', icon: 'Sparkles', color: '#84CC16' },
  { id: 'cat_donation_ncc', parentId: 'cat_life_entertainment', nameEn: 'Donation_NCC_Good', nameBg: 'Дарение_NCC_Добро', type: 'wants', icon: 'HeartHandshake', color: '#84CC16' },
  { id: 'cat_holiday_trips', parentId: 'cat_life_entertainment', nameEn: 'Holiday, trips, hotels', nameBg: 'Почивки, екскурзии, хотели', type: 'wants', icon: 'Plane', color: '#84CC16' },
  { id: 'cat_tv_streaming', parentId: 'cat_life_entertainment', nameEn: 'TV, Streaming', nameBg: 'ТВ, Стрийминг', type: 'wants', icon: 'Tv', color: '#84CC16' },
  { id: 'cat_books_audio_subs', parentId: 'cat_life_entertainment', nameEn: 'Books, audio, subscriptions', nameBg: 'Книги, аудио, абонаменти', type: 'wants', icon: 'BookOpen', color: '#84CC16' },
  { id: 'cat_education_dev', parentId: 'cat_life_entertainment', nameEn: 'Education, development', nameBg: 'Образование, развитие', type: 'wants', icon: 'GraduationCap', color: '#84CC16' },
  { id: 'cat_hobbies', parentId: 'cat_life_entertainment', nameEn: 'Hobbies', nameBg: 'Хобита', type: 'wants', icon: 'Palette', color: '#84CC16' },
  { id: 'cat_life_events', parentId: 'cat_life_entertainment', nameEn: 'Life events', nameBg: 'Житейски събития', type: 'wants', icon: 'Calendar', color: '#84CC16' },
  { id: 'cat_culture_sport_events', parentId: 'cat_life_entertainment', nameEn: 'Culture, sport events', nameBg: 'Култура, спортни събития', type: 'wants', icon: 'Ticket', color: '#84CC16' },
  { id: 'cat_active_sport_fitness', parentId: 'cat_life_entertainment', nameEn: 'Active sport, fitness', nameBg: 'Активен спорт, фитнес', type: 'wants', icon: 'Dumbbell', color: '#84CC16' },
  { id: 'cat_wellness_beauty', parentId: 'cat_life_entertainment', nameEn: 'Wellness, beauty', nameBg: 'Уелнес, красота', type: 'wants', icon: 'Sparkles', color: '#84CC16' },
  { id: 'cat_health_care_doctor', parentId: 'cat_life_entertainment', nameEn: 'Health care, doctor', nameBg: 'Здравеопазване, лекар', type: 'wants', icon: 'Stethoscope', color: '#84CC16' },

  // 6. Communication, PC
  { id: 'cat_communication_pc', nameEn: 'Communication, PC', nameBg: 'Комуникации, компютър', type: 'bills', icon: 'Monitor', color: '#3B82F6' },
  { id: 'cat_postal_services', parentId: 'cat_communication_pc', nameEn: 'Postal services', nameBg: 'Пощенски услуги', type: 'bills', icon: 'Mail', color: '#3B82F6' },
  { id: 'cat_software_apps_games', parentId: 'cat_communication_pc', nameEn: 'Software, apps, games', nameBg: 'Софтуер, приложения, игри', type: 'bills', icon: 'Gamepad2', color: '#3B82F6' },
  { id: 'cat_internet', parentId: 'cat_communication_pc', nameEn: 'Internet', nameBg: 'Интернет', type: 'bills', icon: 'Wifi', color: '#3B82F6' },
  { id: 'cat_telephony_mobile', parentId: 'cat_communication_pc', nameEn: 'Telephony, mobile phone', nameBg: 'Телефония, мобилен телефон', type: 'bills', icon: 'Phone', color: '#3B82F6' },

  // 7. Financial expenses
  { id: 'cat_financial_expenses', nameEn: 'Financial expenses', nameBg: 'Финансови разходи', type: 'bills', icon: 'Landmark', color: '#14B8A6' },
  { id: 'cat_child_support_exp', parentId: 'cat_financial_expenses', nameEn: 'Child Support', nameBg: 'Издръжка за дете', type: 'bills', icon: 'Heart', color: '#14B8A6' },
  { id: 'cat_charges_fees', parentId: 'cat_financial_expenses', nameEn: 'Charges, Fees', nameBg: 'Такси, комисионни', type: 'bills', icon: 'Receipt', color: '#14B8A6' },
  { id: 'cat_advisory', parentId: 'cat_financial_expenses', nameEn: 'Advisory', nameBg: 'Консултантски услуги', type: 'bills', icon: 'UserCheck', color: '#14B8A6' },
  { id: 'cat_fines', parentId: 'cat_financial_expenses', nameEn: 'Fines', nameBg: 'Глоби, санкции', type: 'bills', icon: 'AlertTriangle', color: '#14B8A6' },
  { id: 'cat_loans_interests', parentId: 'cat_financial_expenses', nameEn: 'Loans, interests', nameBg: 'Кредити, лихви', type: 'bills', icon: 'Percent', color: '#14B8A6' },
  { id: 'cat_insurances', parentId: 'cat_financial_expenses', nameEn: 'Insurances', nameBg: 'Застраховки', type: 'bills', icon: 'Shield', color: '#14B8A6' },
  { id: 'cat_taxes', parentId: 'cat_financial_expenses', nameEn: 'Taxes', nameBg: 'Данъци', type: 'bills', icon: 'FileText', color: '#14B8A6' },

  // 8. Investments
  { id: 'cat_investments', nameEn: 'Investments', nameBg: 'Инвестиции', type: 'savings', icon: 'TrendingUp', color: '#EC4899' },
  { id: 'cat_collections', parentId: 'cat_investments', nameEn: 'Collections', nameBg: 'Колекции', type: 'savings', icon: 'Box', color: '#EC4899' },
  { id: 'cat_savings_sub', parentId: 'cat_investments', nameEn: 'Savings', nameBg: 'Спестявания', type: 'savings', icon: 'PiggyBank', color: '#EC4899' },
  { id: 'cat_fin_investments', parentId: 'cat_investments', nameEn: 'Financial investments', nameBg: 'Финансови инвестиции', type: 'savings', icon: 'LineChart', color: '#EC4899' },
  { id: 'cat_vehicles_chattels', parentId: 'cat_investments', nameEn: 'Vehicles, chattels', nameBg: 'Превозни средства, движимо имущество', type: 'savings', icon: 'Car', color: '#EC4899' },
  { id: 'cat_realty', parentId: 'cat_investments', nameEn: 'Realty', nameBg: 'Недвижими имоти', type: 'savings', icon: 'Building', color: '#EC4899' },

  // 9. Income
  { id: 'cat_income', nameEn: 'Income', nameBg: 'Приход', type: 'income', icon: 'Banknote', color: '#10B981' },
  { id: 'cat_gifts_inc', parentId: 'cat_income', nameEn: 'Gifts', nameBg: 'Подаръци', type: 'income', icon: 'Gift', color: '#10B981' },
  { id: 'cat_child_support_inc', parentId: 'cat_income', nameEn: 'Child Support', nameBg: 'Издръжка за дете', type: 'income', icon: 'Heart', color: '#10B981' },
  { id: 'cat_refunds', parentId: 'cat_income', nameEn: 'Refunds (tax, purchase)', nameBg: 'Възстановяване на суми (данъци, покупки)', type: 'income', icon: 'RotateCcw', color: '#10B981' },
  { id: 'cat_lottery_inc', parentId: 'cat_income', nameEn: 'Lottery, gambling', nameBg: 'Лотария, хазарт', type: 'income', icon: 'Dices', color: '#10B981' },
  { id: 'cat_checks_coupons', parentId: 'cat_income', nameEn: 'Checks, coupons', nameBg: 'Чекове, ваучери', type: 'income', icon: 'Ticket', color: '#10B981' },
  { id: 'cat_lending_renting', parentId: 'cat_income', nameEn: 'Lending, renting', nameBg: 'Заем, отдаване', type: 'income', icon: 'Handshake', color: '#10B981' },
  { id: 'cat_dues_grants', parentId: 'cat_income', nameEn: 'Dues & grants', nameBg: 'Такси и грантове', type: 'income', icon: 'Award', color: '#10B981' },
  { id: 'cat_rental_income', parentId: 'cat_income', nameEn: 'Rental income', nameBg: 'Приход от наем', type: 'income', icon: 'Home', color: '#10B981' },
  { id: 'cat_sale', parentId: 'cat_income', nameEn: 'Sale', nameBg: 'Продажба', type: 'income', icon: 'ShoppingBag', color: '#10B981' },
  { id: 'cat_interests_dividends', parentId: 'cat_income', nameEn: 'Interests, dividends', nameBg: 'Лихви, дивиденти', type: 'income', icon: 'TrendingUp', color: '#10B981' },
  { id: 'cat_salary', parentId: 'cat_income', nameEn: 'Wage, invoices', nameBg: 'Заплата, фактури', type: 'income', icon: 'Banknote', color: '#10B981' },

  // 10. Others
  { id: 'cat_others', nameEn: 'Others', nameBg: 'Други', type: 'needs', icon: 'MoreHorizontal', color: '#64748B' },
  { id: 'cat_missing', parentId: 'cat_others', nameEn: 'Missing', nameBg: 'Липсващи', type: 'needs', icon: 'HelpCircle', color: '#64748B' },
];

export const INITIAL_APP_STATE: AppState = {
  isNewUser: false,
  settings: {
    salary: 3000,
    currency: 'BGN',
    startDay: 1,
    language: 'bg',
    theme: 'dark',
    tithePercent: 10,
    wealthPercent: 10,
    rollover: true,
    rolloverAmount: 0,
    autoGenerateRecurringBills: true,
    budgetLimits: {},
  },
  goals: [
    {
      id: 'g1',
      name: 'Emergency Fund / Авариен Фонд',
      targetAmount: 5000,
      currentAmount: 1800,
      startingAmount: 1000,
      monthlyTarget: 300,
      icon: 'Shield'
    },
    {
      id: 'g2',
      name: 'Summer Vacation / Лятна Почивка',
      targetAmount: 2000,
      currentAmount: 650,
      startingAmount: 200,
      monthlyTarget: 200,
      icon: 'Plane'
    }
  ],
  bills: [
    {
      id: 'b1',
      name: 'Apartment Rent / Наем',
      amount: 600,
      dueDateDay: 5,
      isPaid: false,
      category: 'cat_rent',
      isRecurring: true,
      autoGenerateTransaction: true
    },
    {
      id: 'b2',
      name: 'Utilities & Power / Ток и Вода',
      amount: 150,
      dueDateDay: 15,
      isPaid: false,
      category: 'cat_energy',
      isRecurring: true,
      autoGenerateTransaction: true
    }
  ],
  debts: [
    {
      id: 'd1',
      name: 'Car Loan / Автокредит',
      amount: 250,
      totalBalance: 4500,
      isPaid: false,
      category: 'cat_debt'
    }
  ],
  transactions: [
    {
      id: 't1',
      amount: 85.40,
      note: 'Weekly Groceries / Седмични покупки',
      category: 'cat_groceries',
      type: 'needs',
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: 't2',
      amount: 24.00,
      note: 'Coffee & Lunch with friends',
      category: 'cat_bar_cafe',
      type: 'wants',
      date: new Date().toISOString().split('T')[0]
    }
  ],
  categories: DEFAULT_CATEGORIES
};
