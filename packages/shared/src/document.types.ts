// Базовые интерфейсы для документов

// Интерфейс для данных учредителя
export interface Member {
  full_name: string;
  birthday: string;
  passport_series: string;
  passport_number: string;
  passport_issue_date: string;
  passport_issued_by: string;
  passport_code: string;
  passport_address: string;
  inn: string;
  // Для формы Р11001 (листы Е и И)
  gender?: '1' | '2' | ''; // 1 — мужской, 2 — женский
  birthplace?: string; // место рождения, как в паспорте
  phone?: string;
  email?: string; // адрес для документов о регистрации; пусто — e-mail кооператива
}

// Адрес кооператива по элементам Государственного адресного реестра (ГАР).
// Генератор заполняет из этих полей п. 3 и 4 формы Р11001 и строку адреса
// для протокола и гарантийного письма — адрес везде один.
export interface GarAddress {
  postal_index?: string;
  region_code?: string; // код субъекта РФ, две цифры: 77 — Москва
  region_name?: string; // для строки адреса: «г. Москва», «Московская обл.»
  mo_type?: string; // 1 — муниципальный район, 2 — городской округ, 3 — внутригородская территория города федерального значения, 4 — муниципальный округ
  mo_name?: string;
  settlement_type?: string; // 1 — городское поселение, 2 — сельское поселение, 3 — межселенная территория, 4 — внутригородской район
  settlement_name?: string;
  locality_type?: string; // город, деревня, село…
  locality_name?: string;
  plan_type?: string; // элемент планировочной структуры
  plan_name?: string;
  street_type?: string; // элемент улично-дорожной сети: улица, проезд, проспект…
  street_name?: string;
  building_type?: string; // здание: д., корп., стр.
  building_number?: string;
  building2_type?: string;
  building2_number?: string;
  building3_type?: string;
  building3_number?: string;
  room_type?: string; // помещение в здании: помещение, офис, кв.
  room_number?: string;
  flat_room_type?: string; // помещение в квартире
  flat_room_number?: string;
  extra?: string; // уточнение только для протокола и письма: «комната № 6»
}

// Базовая информация о кооперативе
export interface BaseCooperativeInfo {
  name: string;
  website: string;
  city: string;
  short_abbr: string;
  full_abbr: string;
  full_abbr_genitive: string;
  full_abbr_dative: string;
  big_full_abbr: string;
  full_abbr_eng: string;
  short_abbr_eng: string;
  eng_name: string;
  chairman_full_name: string;
  contact_email: string;
  confidential_email: string;
  confidential_link: string;
}

// Интерфейс для пакета подключения (документы 1-100, 50)
export interface ConnectionPackageData extends BaseCooperativeInfo {
  // Данные протокола - все документы используют одну дату
  protocol_date: string; // Исходная дата
  
  // Автоматически генерируемые из protocol_date:
  wallet_protocol_number: string;
  wallet_protocol_day_and_month: string;
  wallet_protocol_year: number;
  
  pep_protocol: string;
  pep_date_and_month: string;
  pep_year: number;
  
  confidential_protocol_number: string;
  confidential_protocol_day_and_month: string;
  confidential_protocol_year: number;
  
  agreement_protocol: string;
  agreement_day_and_month: string;
  agreement_year: number;
  
  coop_offer_protocol: string;
  coop_offer_day_and_month: string;
  coop_offer_year: string;
}

// Интерфейс для нового кооператива (ustav.docx, protocol_1.docx)
// Гарантийное письмо собственника помещения. Раздел формы необязательный:
// пустое поле остаётся в письме жёлтой подсказкой для ручного заполнения.
export interface GarantLetterData {
  tax_authority?: string;
  owner_full_name?: string;
  owner_birthday?: string; // YYYY-MM-DD
  owner_address?: string;
  owner_inn?: string;
  owner_passport?: string; // серия и номер
  owner_passport_issued_by?: string;
  owner_passport_issue_date?: string; // YYYY-MM-DD
  owner_passport_code?: string;
  premises_part?: string;
  premises_area?: string;
  egrn_record?: string;
  egrn_date?: string; // YYYY-MM-DD
  letter_date?: string; // YYYY-MM-DD
}

export interface NewCooperativeData extends BaseCooperativeInfo {
  // Гарантийное письмо собственника помещения (необязательно)
  garant?: GarantLetterData;

  // Адрес по ГАР, коды ОКВЭД и выдача документов на бумаге — для формы Р11001
  address?: GarAddress;
  okved?: string; // коды через запятую или с новой строки, первый — основной
  paper_copy?: boolean; // выдать председателю документы о регистрации на бумаге

  // Подпункты 13.4 устава, которые председатель решает единолично без кворума
  // совета (буквы а–и без ж). По умолчанию — б).
  chair_powers?: string[];

  // Продолжение наименования формы после «Потребительское Общество»,
  // например «взаимного обеспечения». Пусто — только основа.
  org_form_tail?: string;

  // Дата учредительного собрания
  founding_date: string; // Исходная дата
  
  // Автоматически генерируемые из founding_date:
  fp_day: string;
  fp_month: string;
  fp_year: string;
  
  // Финансовые параметры
  initial_individuals_and_entprs: number;
  initial_individuals_and_entprs_text: string;
  initial_organizations: number;
  initial_organizations_text: string;
  minimum_individuals_and_entprs: number;
  minimum_individuals_and_entprs_text: string;
  minimum_organizations: number;
  minimum_organizations_text: string;
  
  // Данные учредителей
  member_1: Member;
  member_2: Member;
  member_3: Member;
  member_4: Member;
  member_5: Member;
  member_6: Member;
  
  // Протокол №1
  protocol_1_date: string;
  index_and_full_address: string;
  protocol_1_open_time: string;
  protocol_1_close_time: string;
}

// Интерфейс для ответа API
export interface DocumentGenerationResponse {
  success: boolean;
  message: string;
  files?: string[];
  downloadUrl?: string;
}

// Интерфейс для статуса генерации
export interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  files?: string[];
  error?: string;
}

// Маппинг документов для пакета подключения
export const CONNECTION_PACKAGE_DOCUMENTS = [
  '1_regulation_on_the_cpp_wallet.docx',
  '2_regulation_simple_electronic_signature.docx', 
  '3_privacy_policy.docx',
  '4_user_agreement.docx',
  '50_coop_agreement.docx',
  '100_individual_application_form.docx',
  '100_entrepreneur_application_form.docx',
  '100_organization_application_form.docx'
] as const;

// Маппинг документов для нового кооператива
export const NEW_COOPERATIVE_DOCUMENTS = [
  'ustav.docx',
  'protocol_1.docx'
] as const;

// Типы документов для генерации
export type DocumentType = 'connection_package' | 'new_cooperative';

// Входные данные для генерации
export type GenerationData = ConnectionPackageData | NewCooperativeData;

// Интерфейс для валидации
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
} 