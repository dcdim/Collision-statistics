const { Pool } = require('pg');
const { DB_CONFIGS } = require('./database/config.js');

const pools = {};
let currentPool = null;

// Инициализация пулов
Object.keys(DB_CONFIGS).forEach(name => {
  pools[name] = new Pool(DB_CONFIGS[name]);
});

// выбор БД
function setDb(name) {
  if (!pools[name]) {
    throw new Error('Unknown DB: ' + name);
  }
  currentPool = pools[name];
  console.log('Switched to DB:', name, '→', DB_CONFIGS[name]);
}

// инициализация дефолтной БД при старте
setDb(Object.keys(DB_CONFIGS)[0]);

async function getEntries() {
  const sql = `
    SELECT "ID", "Name"
    FROM "Entries"
    ORDER BY "ID"
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesArKr() {
  const sql = `
    SELECT
      "UpdateDate",
      SUM("CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE e."Name" LIKE '%АР-КР%'
    GROUP BY "UpdateDate"
    ORDER BY "UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getArKrDetails() {
  const sql = `
    WITH LatestData AS (
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- 1. Извлекаем АР-часть (между _АР-КР_ и _VS_)
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_АР-КР_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_АР-КР_') + 7))
          )
        ), 'АР_', ''), 'АР-', ''), 'АР ', '') AS "PrimaryElement",
        
        -- 2. Извлекаем КР-часть (после _VS_)
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      WHERE e."Name" LIKE '%_АР-КР_%'
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    SELECT 
      "PrimaryElement",
      SUM("TotalAmount") as "GroupTotal",
      json_agg(json_build_object(
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "TotalAmount"
      ) ORDER BY "TotalAmount" DESC) as "Details"
    FROM MergedData
    GROUP BY "PrimaryElement"
    ORDER BY "GroupTotal" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesArAr() {
  const sql = `
    SELECT
      "UpdateDate",
      SUM("CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE e."Name" LIKE '%АР-АР%'
    GROUP BY "UpdateDate"
    ORDER BY "UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getArArDetails() {
  const sql = `
    WITH LatestData AS (
      -- 1. Получаем самые свежие данные для каждого ID записи
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- Извлекаем Основной элемент и чистим префиксы
        REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_АР-АР_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_АР-АР_') + 7))
          )
        ), 'АР_', ''), 'АР-', '') AS "PrimaryElement",
        
        -- Извлекаем категорию после _VS_ и чистим префиксы
        REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'АР_', ''), 'АР-', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      WHERE e."Name" LIKE '%_АР-АР_%'
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedCategories AS (
      -- 2. Группируем по ОБОИМ элементам, чтобы сложить значения одинаковых категорий
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalCollisions"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- 3. Собираем финальный JSON с агрегацией по PrimaryElement
    SELECT 
      "PrimaryElement",
      COUNT("CategoryElement") as "SubElementsCount",
      SUM("TotalCollisions") as "GroupTotal",
      json_agg(json_build_object(
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "TotalCollisions"
      ) ORDER BY "TotalCollisions" DESC) as "Details"
    FROM MergedCategories
    GROUP BY "PrimaryElement"
    ORDER BY "GroupTotal" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesArTh() {
  const sql = `
    SELECT
      "UpdateDate",
      SUM("CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE e."Name" LIKE '%АР-ТХ%'
    GROUP BY "UpdateDate"
    ORDER BY "UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getArThDetails() {
  const sql = `
    WITH LatestData AS (
      -- 1. Берем только последние данные для каждого ID записи
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- Извлекаем АР-часть и чистим префиксы (АР_, АР-, АР )
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_АР-ТХ_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_АР-ТХ_') + 7))
          )
        ), 'АР_', ''), 'АР-', ''), 'АР ', '') AS "PrimaryElement",
        
        -- Извлекаем ТХ-часть (после _VS_) и чистим префиксы (ТХ_, ТХ-, ТХ )
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      WHERE e."Name" LIKE '%_АР-ТХ_%'
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      -- 2. Группируем по очищенным парам элементов
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- 3. Агрегация для таблицы
    SELECT 
      "PrimaryElement",
      SUM("TotalAmount") as "GroupTotal",
      json_agg(json_build_object(
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "TotalAmount"
      ) ORDER BY "TotalAmount" DESC) as "Details"
    FROM MergedData
    GROUP BY "PrimaryElement"
    ORDER BY "GroupTotal" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesKrKr() {
  const sql = `
    SELECT
      "UpdateDate",
      SUM("CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE e."Name" LIKE '%КР-КР%'
    GROUP BY "UpdateDate"
    ORDER BY "UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getKrKrDetails() {
  const sql = `
    WITH LatestData AS (
      -- 1. Получаем последние данные по каждому ID
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- Очистка первого элемента КР (между _КР-КР_ и _VS_)
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_КР-КР_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_КР-КР_') + 7))
          )
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "PrimaryElement",
        
        -- Очистка второго элемента КР (после _VS_)
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      WHERE e."Name" LIKE '%_КР-КР_%'
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      -- 2. Группируем очищенные данные
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- 3. Агрегация в JSON для интерфейса
    SELECT 
      "PrimaryElement",
      SUM("TotalAmount") as "GroupTotal",
      json_agg(json_build_object(
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "TotalAmount"
      ) ORDER BY "TotalAmount" DESC) as "Details"
    FROM MergedData
    GROUP BY "PrimaryElement"
    ORDER BY "GroupTotal" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesKrTh() {
  const sql = `
    SELECT
      "UpdateDate",
      SUM("CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE e."Name" LIKE '%КР-ТХ%'
    GROUP BY "UpdateDate"
    ORDER BY "UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getKrThDetails() {
  const sql = `
    WITH LatestData AS (
      -- 1. Берем самые свежие данные для каждого ID
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- Извлекаем КР-часть и чистим префиксы
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_КР-ТХ_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_КР-ТХ_') + 7))
          )
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "PrimaryElement",
        
        -- Извлекаем ТХ-часть и чистим префиксы
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      WHERE e."Name" LIKE '%_КР-ТХ_%'
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      -- 2. Группируем очищенные элементы
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- 3. Агрегируем в JSON для фронтенда
    SELECT 
      "PrimaryElement",
      SUM("TotalAmount") as "GroupTotal",
      json_agg(json_build_object(
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "TotalAmount"
      ) ORDER BY "TotalAmount" DESC) as "Details"
    FROM MergedData
    GROUP BY "PrimaryElement"
    ORDER BY "GroupTotal" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesThTh() {
  const sql = `
    SELECT
      "UpdateDate",
      SUM("CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE e."Name" LIKE '%ТХ-ТХ%'
    GROUP BY "UpdateDate"
    ORDER BY "UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getThThDetails() {
  const sql = `
    WITH LatestData AS (
      -- 1. Получаем последние данные по каждому ID
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- Очистка первого элемента ТХ (между _ТХ-ТХ_ и _VS_)
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_ТХ-ТХ_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_ТХ-ТХ_') + 7))
          )
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "PrimaryElement",
        
        -- Очистка второго элемента ТХ (после _VS_)
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      WHERE e."Name" LIKE '%_ТХ-ТХ_%'
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      -- 2. Группируем очищенные данные, чтобы схлопнуть дубликаты из разных файлов
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- 3. Агрегация в JSON для таблицы с раскрывающимися списками
    SELECT 
      "PrimaryElement",
      SUM("TotalAmount") as "GroupTotal",
      json_agg(json_build_object(
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "TotalAmount"
      ) ORDER BY "TotalAmount" DESC) as "Details"
    FROM MergedData
    GROUP BY "PrimaryElement"
    ORDER BY "GroupTotal" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesArEn() {
  const sql = `
    SELECT
      eu."UpdateDate" AS "UpdateDate",
      SUM(eu."CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE (
      e."Name" LIKE '%АР-ОВ%' OR e."Name" LIKE '%АР-ОТ%' OR e."Name" LIKE '%АР-ТС%' OR
      e."Name" LIKE '%АР-ХС%' OR e."Name" LIKE '%АР-ИТП%' OR e."Name" LIKE '%АР-ВК%' OR
      e."Name" LIKE '%АР-В%'  OR e."Name" LIKE '%АР-К%'   OR e."Name" LIKE '%АР-ПТ%' OR
      e."Name" LIKE '%АР-ЭМ%' OR e."Name" LIKE '%АР-СС%' OR e."Name" LIKE '%АР-СПЗ%' OR
      e."Name" LIKE '%АР-АК%' OR e."Name" LIKE '%АР-ГПТ%'
    )
    AND e."Name" NOT LIKE '%АР-КР%'
    GROUP BY eu."UpdateDate"
    ORDER BY eu."UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getArEnDetails() {
  const sql = `
    WITH LatestData AS (
      -- 1. Получаем последние данные и определяем код системы
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- Список систем:
        (REGEXP_MATCH(e."Name", '_АР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'))[1] AS "SystemType",
        
        -- Позиция начала системного маркера
        STRPOS(e."Name", '_АР-') AS "MarkerPos",

        -- Извлечение правой части (после _VS_)
        TRIM(SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)) AS "RawSystemElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      -- Фильтр: ищем любой из 14 разделов
      WHERE e."Name" ~ '_АР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    ProcessedData AS (
      -- 2. Глубокая очистка имен
      SELECT 
        "SystemType",
        -- Очистка АР-части (левая сторона)
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            "Name" FROM "MarkerPos" + (LENGTH("SystemType") + 5) 
            FOR (STRPOS("Name", '_VS_') - ("MarkerPos" + (LENGTH("SystemType") + 5)))
          )
        ), 'АР_', ''), 'АР-', ''), 'АР ', '') AS "PrimaryElement",
        
        -- Очистка системной части (правая сторона): удаляем СС_, СС- или СС 
        REGEXP_REPLACE("RawSystemElement", '^(' || "SystemType" || ')(_|\\-| )', '', 'i') AS "CategoryElement",
        
        "CollisionsAmount"
      FROM LatestData
      WHERE "SystemType" IS NOT NULL
    ),
    MergedData AS (
      -- 3. Группировка данных
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        "SystemType",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM ProcessedData
      GROUP BY "PrimaryElement", "CategoryElement", "SystemType"
    )
    -- 4. Сборка JSON
    SELECT 
      "PrimaryElement",
      SUM("TotalAmount") as "GroupTotal",
      json_agg(json_build_object(
        'system_type', "SystemType",
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "TotalAmount"
      ) ORDER BY "TotalAmount" DESC) as "Details"
    FROM MergedData
    GROUP BY "PrimaryElement"
    ORDER BY "GroupTotal" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesKrEn() {
  const sql = `
    SELECT
      eu."UpdateDate" AS "UpdateDate",
      SUM(eu."CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE (
      e."Name" LIKE '%КР-ОВ%' OR e."Name" LIKE '%КР-ОТ%' OR e."Name" LIKE '%КР-ТС%' OR
      e."Name" LIKE '%КР-ХС%' OR e."Name" LIKE '%КР-ИТП%' OR e."Name" LIKE '%КР-ВК%' OR
      e."Name" LIKE '%КР-В%'  OR e."Name" LIKE '%КР-К%'   OR e."Name" LIKE '%КР-ПТ%' OR
      e."Name" LIKE '%КР-ЭМ%' OR e."Name" LIKE '%КР-СС%' OR e."Name" LIKE '%КР-СПЗ%' OR
      e."Name" LIKE '%КР-АК%' OR e."Name" LIKE '%КР-ГПТ%'
    )
    AND e."Name" NOT LIKE '%КР-КР%'
    GROUP BY eu."UpdateDate"
    ORDER BY eu."UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getKrEnDetails() {
  const sql = `
    WITH LatestData AS (
      -- 1. Получаем последние данные и определяем код системы
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- Список систем:
        (REGEXP_MATCH(e."Name", '_КР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'))[1] AS "SystemType",
        
        -- Позиция начала системного маркера
        STRPOS(e."Name", '_КР-') AS "MarkerPos",

        -- Извлечение правой части (после _VS_)
        TRIM(SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)) AS "RawSystemElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      -- Фильтр: ищем любой из 14 разделов
      WHERE e."Name" ~ '_КР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    ProcessedData AS (
      -- 2. Глубокая очистка имен
      SELECT 
        "SystemType",
        -- Очистка КР-части (левая сторона)
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            "Name" FROM "MarkerPos" + (LENGTH("SystemType") + 5) 
            FOR (STRPOS("Name", '_VS_') - ("MarkerPos" + (LENGTH("SystemType") + 5)))
          )
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "PrimaryElement",
        
        -- Очистка системной части (правая сторона): удаляем СС_, СС- или СС 
        REGEXP_REPLACE("RawSystemElement", '^(' || "SystemType" || ')(_|\\-| )', '', 'i') AS "CategoryElement",
        
        "CollisionsAmount"
      FROM LatestData
      WHERE "SystemType" IS NOT NULL
    ),
    MergedData AS (
      -- 3. Группировка данных
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        "SystemType",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM ProcessedData
      GROUP BY "PrimaryElement", "CategoryElement", "SystemType"
    )
    -- 4. Сборка JSON
    SELECT 
      "PrimaryElement",
      SUM("TotalAmount") as "GroupTotal",
      json_agg(json_build_object(
        'system_type', "SystemType",
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "TotalAmount"
      ) ORDER BY "TotalAmount" DESC) as "Details"
    FROM MergedData
    GROUP BY "PrimaryElement"
    ORDER BY "GroupTotal" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesThEn() {
  const sql = `
    SELECT
      eu."UpdateDate" AS "UpdateDate",
      SUM(eu."CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE (
      e."Name" LIKE '%ТХ-ОВ%' OR e."Name" LIKE '%ТХ-ОТ%' OR e."Name" LIKE '%ТХ-ТС%' OR
      e."Name" LIKE '%ТХ-ХС%' OR e."Name" LIKE '%ТХ-ИТП%' OR e."Name" LIKE '%ТХ-ВК%' OR
      e."Name" LIKE '%ТХ-В%'  OR e."Name" LIKE '%ТХ-К%'   OR e."Name" LIKE '%ТХ-ПТ%' OR
      e."Name" LIKE '%ТХ-ЭМ%' OR e."Name" LIKE '%ТХ-СС%' OR e."Name" LIKE '%ТХ-СПЗ%' OR
      e."Name" LIKE '%ТХ-АК%' OR e."Name" LIKE '%ТХ-ГПТ%'
    )
    AND e."Name" NOT LIKE '%ТХ-КР%'
    GROUP BY eu."UpdateDate"
    ORDER BY eu."UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getThEnDetails() {
  const sql = `
    WITH LatestData AS (
      -- 1. Получаем последние данные и определяем код системы
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- Список систем:
        (REGEXP_MATCH(e."Name", '_ТХ-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'))[1] AS "SystemType",
        
        -- Позиция начала системного маркера
        STRPOS(e."Name", '_ТХ-') AS "MarkerPos",

        -- Извлечение правой части (после _VS_)
        TRIM(SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)) AS "RawSystemElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      -- Фильтр: ищем любой из 14 разделов
      WHERE e."Name" ~ '_ТХ-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    ProcessedData AS (
      -- 2. Глубокая очистка имен
      SELECT 
        "SystemType",
        -- Очистка ТХ-части (левая сторона)
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            "Name" FROM "MarkerPos" + (LENGTH("SystemType") + 5) 
            FOR (STRPOS("Name", '_VS_') - ("MarkerPos" + (LENGTH("SystemType") + 5)))
          )
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "PrimaryElement",
        
        -- Очистка системной части (правая сторона): удаляем СС_, СС- или СС 
        REGEXP_REPLACE("RawSystemElement", '^(' || "SystemType" || ')(_|\\-| )', '', 'i') AS "CategoryElement",
        
        "CollisionsAmount"
      FROM LatestData
      WHERE "SystemType" IS NOT NULL
    ),
    MergedData AS (
      -- 3. Группировка данных
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        "SystemType",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM ProcessedData
      GROUP BY "PrimaryElement", "CategoryElement", "SystemType"
    )
    -- 4. Сборка JSON
    SELECT 
      "PrimaryElement",
      SUM("TotalAmount") as "GroupTotal",
      json_agg(json_build_object(
        'system_type', "SystemType",
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "TotalAmount"
      ) ORDER BY "TotalAmount" DESC) as "Details"
    FROM MergedData
    GROUP BY "PrimaryElement"
    ORDER BY "GroupTotal" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getEntriesUpdatesArDuble() {
  const sql = `
    SELECT
      eu."UpdateDate" AS "UpdateDate",
      SUM(eu."CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE e."Name" LIKE '%Дубл_АР%'
    GROUP BY eu."UpdateDate"
    ORDER BY eu."UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getEntriesUpdatesKrDuble() {
  const sql = `
    SELECT
      eu."UpdateDate" AS "UpdateDate",
      SUM(eu."CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE e."Name" LIKE '%Дубл_КР%'
    GROUP BY eu."UpdateDate"
    ORDER BY eu."UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getEntriesUpdatesEnEn() {
  const sql = `
    SELECT
      eu."UpdateDate" AS "UpdateDate",
      SUM(eu."CollisionsAmount") AS "CollisionsAmount"
    FROM "EntriesUpdates" eu
    JOIN "Entries" e ON eu."EntryId" = e."ID"
    WHERE
      -- Используем то же регулярное выражение, что и в детальном отчете
      e."Name" ~ '_(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
    GROUP BY eu."UpdateDate"
    ORDER BY eu."UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getEnEnDetails() {
  const sql = `
    WITH LastUpdate AS (
      -- Находим дату самого последнего обновления
      SELECT MAX("UpdateDate") as "MaxDate" FROM "EntriesUpdates"
    ),
    LatestData AS (
      -- 1. Получаем уникальные записи за последнюю дату
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        (REGEXP_MATCH(e."Name", '_([А-ЯЁA-Z]+)-([А-ЯЁA-Z]+)_'))[1] AS "MainSystem",
        (REGEXP_MATCH(e."Name", '_([А-ЯЁA-Z]+)-([А-ЯЁA-Z]+)_'))[2] AS "SecondarySystem",
        STRPOS(e."Name", '_VS_') AS "VSPos",
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate"
      WHERE e."Name" ~ '_(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
        AND eu."CollisionsAmount" > 0
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    ProcessedData AS (
      -- 2. Очищаем названия категорий
      SELECT 
        "MainSystem" AS "PrimaryElement",
        "SecondarySystem" AS "SystemType",
        REGEXP_REPLACE(
          TRIM(SUBSTRING("Name" FROM "VSPos" + 4)), 
          '^(' || "SecondarySystem" || ')(_|\\-| )', 
          '', 
          'i'
        ) AS "CategoryElement",
        "CollisionsAmount"
      FROM LatestData
      WHERE "VSPos" > 0
    ),
    GroupedCategories AS (
      -- 3. СУММИРУЕМ одинаковые категории внутри систем
      -- Именно здесь происходит схлопывание повторов типа "К Трубы (больше 100)"
      SELECT 
        "PrimaryElement",
        "SystemType",
        "CategoryElement",
        SUM("CollisionsAmount") as "CategorySum"
      FROM ProcessedData
      GROUP BY "PrimaryElement", "SystemType", "CategoryElement"
    )
    -- 4. Итоговая сборка в JSON
    SELECT 
      "PrimaryElement",
      SUM("CategorySum") as "GroupTotal",
      json_agg(json_build_object(
        'system_type', "SystemType",
        'primary_part', "PrimaryElement",
        'category_part', "CategoryElement",
        'amount', "CategorySum"
      ) ORDER BY "SystemType" ASC, "CategorySum" DESC) as "Details"
    FROM GroupedCategories
    GROUP BY "PrimaryElement"
    ORDER BY "PrimaryElement" ASC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

module.exports = {
  DB_CONFIGS,
  setDb,
  getEntries,
  getEntriesUpdatesArKr,
  getEntriesUpdatesArAr,
  getEntriesUpdatesArTh,
  getEntriesUpdatesKrKr,
  getEntriesUpdatesKrTh,
  getEntriesUpdatesThTh,
  getEntriesUpdatesArEn,
  getEntriesUpdatesKrEn,
  getEntriesUpdatesThEn,
  getEntriesUpdatesArDuble,
  getEntriesUpdatesKrDuble,
  getEntriesUpdatesEnEn,
  getArArDetails,
  getArKrDetails,
  getArThDetails,
  getKrKrDetails,
  getKrThDetails,
  getThThDetails,
  getArEnDetails,
  getKrEnDetails,
  getThEnDetails,
  getEnEnDetails,
};
