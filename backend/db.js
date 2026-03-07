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

// Инициализация первой доступной БД при запуске
if (Object.keys(DB_CONFIGS).length > 0) {
  setDb(Object.keys(DB_CONFIGS)[0]);
}

// Вспомогательная функция для выполнения запросов к текущей БД
async function query(sql, params) {
  return await currentPool.query(sql, params);
}

async function getEntries() {
  const sql = `
  SELECT "ID", "Name"
  FROM "Entries"
  ORDER BY "ID"
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
}

async function getTotalCollisions() {
  const sql = `
  SELECT SUM("CollisionsAmount") AS "total"
  FROM "EntriesUpdates"
  WHERE "UpdateDate" = (SELECT MAX("UpdateDate") FROM "EntriesUpdates");
  `;
  const { rows } = await currentPool.query(sql);
  return rows[0].total || 0;
}

async function getTotalStats() {
  const sql = `
    WITH LastTwoDates AS (
      SELECT DISTINCT "UpdateDate"
      FROM "EntriesUpdates"
      ORDER BY "UpdateDate" DESC
      LIMIT 2
    ),
    DailyTotals AS (
      SELECT "UpdateDate", SUM("CollisionsAmount") as daily_sum
      FROM "EntriesUpdates"
      WHERE "UpdateDate" IN (SELECT "UpdateDate" FROM LastTwoDates)
      GROUP BY "UpdateDate"
    )
    SELECT * FROM DailyTotals ORDER BY "UpdateDate" DESC;
  `;
  
  const { rows } = await currentPool.query(sql);
  
  const currentTotal = rows[0] ? parseInt(rows[0].daily_sum) : 0;
  const previousTotal = rows[1] ? parseInt(rows[1].daily_sum) : currentTotal;
  const delta = currentTotal - previousTotal;

  return { total: currentTotal, delta: delta };
}

async function getTotalCollisionsByProject(dbNames) {
  let totalSum = 0;
  
  for (const dbName of dbNames) {
    try {
      // Используем существующий пул из объекта pools, который создается в setDb
      // Если пула нет, временно создаем его
      if (!pools[dbName]) {
        await setDb(dbName);
      }
      
      const pool = pools[dbName];
      const sql = `
      SELECT SUM("CollisionsAmount") AS "total"
        FROM "EntriesUpdates"
        WHERE "UpdateDate" = (SELECT MAX("UpdateDate") FROM "EntriesUpdates");
      `;
      
      const { rows } = await pool.query(sql);
      const dbTotal = parseInt(rows[0].total) || 0;
      totalSum += dbTotal;
    } catch (err) {
      console.error(`Ошибка при подсчете суммы для БД ${dbName}:`, err.message);
      // Если по одной БД ошибка, продолжаем считать остальные
    }
  }
  
  return totalSum;
}

async function getProjectTotalWithDelta(dbNames) {
  let totalCurrent = 0;
  let totalPrevious = 0;

  for (const dbName of dbNames) {
    try {
      // 1. Убеждаемся, что пул для этой БД создан
      // Функция setDb создает пул и кладет его в объект pools[dbName]
      if (!pools[dbName]) {
        await setDb(dbName);
      }
      
      const pool = pools[dbName];
      if (!pool) {
        console.warn(`Пул для базы ${dbName} не найден, пропускаем...`);
        continue;
      }

      // 2. SQL запрос
      const sql = `
        WITH LastTwoDates AS (
          SELECT DISTINCT "UpdateDate"
          FROM "EntriesUpdates"
          ORDER BY "UpdateDate" DESC
          LIMIT 2
        ),
        DailyTotals AS (
          SELECT "UpdateDate", SUM("CollisionsAmount") as daily_sum
          FROM "EntriesUpdates"
          WHERE "UpdateDate" IN (SELECT "UpdateDate" FROM LastTwoDates)
          GROUP BY "UpdateDate"
        )
        SELECT "UpdateDate", daily_sum FROM DailyTotals ORDER BY "UpdateDate" DESC;
      `;

      const { rows } = await pool.query(sql);

      if (rows && rows.length > 0) {
        // Текущее значение (самая свежая дата)
        const current = rows[0].daily_sum ? parseInt(rows[0].daily_sum, 10) : 0;
        
        // Предыдущее значение (если дат меньше двух, берем текущее, чтобы дельта была 0)
        const previous = rows[1] ? parseInt(rows[1].daily_sum, 10) : current;

        totalCurrent += current;
        totalPrevious += previous;
        
        console.log(`Проектная отладка [${dbName}]: Тек=${current}, Пред=${previous}`);
      }
    } catch (err) {
      console.error(`Ошибка при обработке базы ${dbName}:`, err.message);
    }
  }

  return { 
    total: totalCurrent, 
    delta: totalCurrent - totalPrevious 
  };
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
    WITH LastUpdate AS (
      -- Находим дату самого последнего обновления для АР-КР
      SELECT MAX(eu."UpdateDate") as "MaxDate" 
      FROM "EntriesUpdates" eu
      JOIN "Entries" e ON eu."EntryId" = e."ID"
      WHERE e."Name" LIKE '%_АР-КР_%'
    ),
    LatestData AS (
      -- Получаем уникальные записи строго за последнюю дату
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_АР-КР_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_АР-КР_') + 7))
          )
        ), 'АР_', ''), 'АР-', ''), 'АР ', '') AS "PrimaryElement",
        
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate"
      WHERE e."Name" LIKE '%_АР-КР_%' 
        AND eu."CollisionsAmount" > 0 -- Скрываем те, где 0
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      -- Группируем для суммирования одинаковых категорий
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- Итоговая сборка с фильтрацией пустых групп
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
    HAVING SUM("TotalAmount") > 0 -- Не выводим системы с общим нулем
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
    WITH LastUpdate AS (
      -- Находим дату самого последнего импорта для АР-АР
      SELECT MAX(eu."UpdateDate") as "MaxDate" 
      FROM "EntriesUpdates" eu
      JOIN "Entries" e ON eu."EntryId" = e."ID"
      WHERE e."Name" LIKE '%_АР-АР_%'
    ),
    LatestData AS (
      -- Берем данные СТРОГО за эту дату и СТРОГО с коллизиями > 0
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_АР-АР_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_АР-АР_') + 7))
          )
        ), 'АР_', ''), 'АР-', '') AS "PrimaryElement",
        
        REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'АР_', ''), 'АР-', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate" -- Фильтр по последней дате
      WHERE e."Name" LIKE '%_АР-АР_%' 
        AND eu."CollisionsAmount" > 0
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedCategories AS (
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalCollisions"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    SELECT 
      "PrimaryElement",
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
    WITH LastUpdate AS (
      -- 1. Находим дату самого последнего обновления именно для АР-ТХ
      SELECT MAX(eu."UpdateDate") as "MaxDate" 
      FROM "EntriesUpdates" eu
      JOIN "Entries" e ON eu."EntryId" = e."ID"
      WHERE e."Name" LIKE '%_АР-ТХ_%'
    ),
    LatestData AS (
      -- 2. Берем записи строго за эту дату с коллизиями больше 0
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_АР-ТХ_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_АР-ТХ_') + 7))
          )
        ), 'АР_', ''), 'АР-', ''), 'АР ', '') AS "PrimaryElement",
        
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate"
      WHERE e."Name" LIKE '%_АР-ТХ_%'
        AND eu."CollisionsAmount" > 0
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      -- 3. Группируем по очищенным парам элементов
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- 4. Итоговая агрегация
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
    HAVING SUM("TotalAmount") > 0
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
    WITH LastUpdate AS (
      -- 1. Находим дату самого последнего обновления для раздела КР-КР
      SELECT MAX(eu."UpdateDate") as "MaxDate" 
      FROM "EntriesUpdates" eu
      JOIN "Entries" e ON eu."EntryId" = e."ID"
      WHERE e."Name" LIKE '%_КР-КР_%'
    ),
    LatestData AS (
      -- 2. Берем записи только за эту дату и где коллизий > 0
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_КР-КР_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_КР-КР_') + 7))
          )
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "PrimaryElement",
        
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate"
      WHERE e."Name" LIKE '%_КР-КР_%'
        AND eu."CollisionsAmount" > 0
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      -- 3. Группируем по очищенным парам
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- 4. Итоговая агрегация с фильтрацией пустых групп
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
    HAVING SUM("TotalAmount") > 0
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
    WITH LastUpdate AS (
      -- 1. Находим дату самого последнего обновления для раздела КР-ТХ
      SELECT MAX(eu."UpdateDate") as "MaxDate" 
      FROM "EntriesUpdates" eu
      JOIN "Entries" e ON eu."EntryId" = e."ID"
      WHERE e."Name" LIKE '%_КР-ТХ_%'
    ),
    LatestData AS (
      -- 2. Берем записи только за эту дату и где коллизий > 0
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_КР-ТХ_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_КР-ТХ_') + 7))
          )
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "PrimaryElement",
        
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate"
      WHERE e."Name" LIKE '%_КР-ТХ_%'
        AND eu."CollisionsAmount" > 0
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      -- 3. Группируем по очищенным парам
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- 4. Итоговая агрегация с фильтрацией пустых групп
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
    HAVING SUM("TotalAmount") > 0
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
    WITH LastUpdate AS (
      -- 1. Находим дату самого последнего обновления для раздела ТХ-ТХ
      SELECT MAX(eu."UpdateDate") as "MaxDate" 
      FROM "EntriesUpdates" eu
      JOIN "Entries" e ON eu."EntryId" = e."ID"
      WHERE e."Name" LIKE '%_ТХ-ТХ_%'
    ),
    LatestData AS (
      -- 2. Получаем данные только за эту дату
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        -- Очистка первого элемента ТХ
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            e."Name" FROM 
            STRPOS(e."Name", '_ТХ-ТХ_') + 7 FOR 
            (STRPOS(e."Name", '_VS_') - (STRPOS(e."Name", '_ТХ-ТХ_') + 7))
          )
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "PrimaryElement",
        
        -- Очистка второго элемента ТХ
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "CategoryElement",
        
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate"
      WHERE e."Name" LIKE '%_ТХ-ТХ_%'
        AND eu."CollisionsAmount" > 0
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    MergedData AS (
      -- 3. Группируем очищенные данные
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM LatestData
      GROUP BY "PrimaryElement", "CategoryElement"
    )
    -- 4. Агрегация в JSON
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
    HAVING SUM("TotalAmount") > 0
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
    WITH LastUpdate AS (
      -- 1. Находим дату самого последнего обновления для инженерных систем
      SELECT MAX(eu."UpdateDate") as "MaxDate" 
      FROM "EntriesUpdates" eu
      JOIN "Entries" e ON eu."EntryId" = e."ID"
      WHERE e."Name" ~ '_АР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
    ),
    LatestData AS (
      -- 2. Получаем уникальные записи строго за последнюю дату
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        (REGEXP_MATCH(e."Name", '_АР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'))[1] AS "SystemType",
        STRPOS(e."Name", '_АР-') AS "MarkerPos",
        TRIM(SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)) AS "RawSystemElement",
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate"
      WHERE e."Name" ~ '_АР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
        AND eu."CollisionsAmount" > 0 -- Скрываем нулевые
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    ProcessedData AS (
      -- 3. Очистка имен
      SELECT 
        "SystemType",
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            "Name" FROM "MarkerPos" + (LENGTH("SystemType") + 5) 
            FOR (STRPOS("Name", '_VS_') - ("MarkerPos" + (LENGTH("SystemType") + 5)))
          )
        ), 'АР_', ''), 'АР-', ''), 'АР ', '') AS "PrimaryElement",
        REGEXP_REPLACE("RawSystemElement", '^(' || "SystemType" || ')(_|\\-| )', '', 'i') AS "CategoryElement",
        "CollisionsAmount"
      FROM LatestData
      WHERE "SystemType" IS NOT NULL
    ),
    MergedData AS (
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        "SystemType",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM ProcessedData
      GROUP BY "PrimaryElement", "CategoryElement", "SystemType"
    )
    -- 4. Сборка JSON с фильтрацией пустых групп
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
    HAVING SUM("TotalAmount") > 0
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
    WITH LastUpdate AS (
      -- 1. Находим дату самого последнего обновления для инженерных систем
      SELECT MAX(eu."UpdateDate") as "MaxDate" 
      FROM "EntriesUpdates" eu
      JOIN "Entries" e ON eu."EntryId" = e."ID"
      WHERE e."Name" ~ '_КР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
    ),
    LatestData AS (
      -- 2. Получаем данные за последнюю дату
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        (REGEXP_MATCH(e."Name", '_КР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'))[1] AS "SystemType",
        STRPOS(e."Name", '_КР-') AS "MarkerPos",
        TRIM(SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)) AS "RawSystemElement",
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate"
      WHERE e."Name" ~ '_КР-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
        AND eu."CollisionsAmount" > 0
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    ProcessedData AS (
      -- 3. Очистка имен
      SELECT 
        "SystemType",
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            "Name" FROM "MarkerPos" + (LENGTH("SystemType") + 5) 
            FOR (STRPOS("Name", '_VS_') - ("MarkerPos" + (LENGTH("SystemType") + 5)))
          )
        ), 'КР_', ''), 'КР-', ''), 'КР ', '') AS "PrimaryElement",
        REGEXP_REPLACE("RawSystemElement", '^(' || "SystemType" || ')(_|\\-| )', '', 'i') AS "CategoryElement",
        "CollisionsAmount"
      FROM LatestData
      WHERE "SystemType" IS NOT NULL
    ),
    MergedData AS (
      -- 4. Группировка
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        "SystemType",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM ProcessedData
      GROUP BY "PrimaryElement", "CategoryElement", "SystemType"
    )
    -- 5. Итоговый JSON
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
    HAVING SUM("TotalAmount") > 0
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
    WITH LastUpdate AS (
      -- 1. Находим дату самого последнего обновления для разделов ТХ-Инженерия
      SELECT MAX(eu."UpdateDate") as "MaxDate" 
      FROM "EntriesUpdates" eu
      JOIN "Entries" e ON eu."EntryId" = e."ID"
      WHERE e."Name" ~ '_ТХ-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
    ),
    LatestData AS (
      -- 2. Получаем данные только за эту дату
      SELECT DISTINCT ON (e."ID") 
        e."ID",
        e."Name",
        (REGEXP_MATCH(e."Name", '_ТХ-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'))[1] AS "SystemType",
        STRPOS(e."Name", '_ТХ-') AS "MarkerPos",
        TRIM(SUBSTRING(e."Name" FROM STRPOS(e."Name", '_VS_') + 4)) AS "RawSystemElement",
        eu."CollisionsAmount"
      FROM "Entries" e
      JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
      JOIN LastUpdate lu ON eu."UpdateDate" = lu."MaxDate"
      WHERE e."Name" ~ '_ТХ-(ОВ|ОТ|ТС|ХС|ИТП|ВК|В|К|ПТ|ЭМ|СС|СПЗ|АК|ГПТ)_'
        AND eu."CollisionsAmount" > 0
      ORDER BY e."ID", eu."UpdateDate" DESC
    ),
    ProcessedData AS (
      -- 3. Очистка имен (удаление префиксов ТХ и системных кодов)
      SELECT 
        "SystemType",
        REPLACE(REPLACE(REPLACE(TRIM(
          SUBSTRING(
            "Name" FROM "MarkerPos" + (LENGTH("SystemType") + 5) 
            FOR (STRPOS("Name", '_VS_') - ("MarkerPos" + (LENGTH("SystemType") + 5)))
          )
        ), 'ТХ_', ''), 'ТХ-', ''), 'ТХ ', '') AS "PrimaryElement",
        REGEXP_REPLACE("RawSystemElement", '^(' || "SystemType" || ')(_|\\-| )', '', 'i') AS "CategoryElement",
        "CollisionsAmount"
      FROM LatestData
      WHERE "SystemType" IS NOT NULL
    ),
    MergedData AS (
      -- 4. Группировка
      SELECT 
        "PrimaryElement",
        "CategoryElement",
        "SystemType",
        SUM("CollisionsAmount") as "TotalAmount"
      FROM ProcessedData
      GROUP BY "PrimaryElement", "CategoryElement", "SystemType"
    )
    -- 5. Финальный JSON для фронтенда
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
    HAVING SUM("TotalAmount") > 0
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

async function getEntriesUpdatesEnDuble() {
  const sql = `
    SELECT 
      eu."UpdateDate", 
      SUM(eu."CollisionsAmount") AS "CollisionsAmount"
    FROM "Entries" e
    JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
    WHERE e."Name" LIKE '%Дубл%' 
      AND e."Name" NOT LIKE '%_АР%'
      AND e."Name" NOT LIKE '%_КР%'
      AND e."Name" NOT LIKE '%_Другое%'
      AND e."Name" NOT LIKE '%_COORD%'
    GROUP BY eu."UpdateDate"
    ORDER BY eu."UpdateDate" DESC
    LIMIT 10
  `;
  const { rows } = await currentPool.query(sql);
  return rows.reverse();
}

async function getEnDubleDetails() {
  const sql = `
    WITH LastUpdate AS (
      SELECT MAX("UpdateDate") as MaxDate FROM "EntriesUpdates"
    )
    SELECT 
      e."Name", 
      eu."CollisionsAmount"
    FROM "Entries" e
    JOIN "EntriesUpdates" eu ON e."ID" = eu."EntryId"
    JOIN LastUpdate lu ON eu."UpdateDate" = lu.MaxDate
    WHERE e."Name" LIKE '000_Дубл_%' 
      AND e."Name" NOT LIKE '%_АР%'
      AND e."Name" NOT LIKE '%_КР%'
      AND e."Name" NOT LIKE '%_COORD%'
      AND e."Name" NOT LIKE '%_Другое%'
      AND eu."CollisionsAmount" > 0
    ORDER BY eu."CollisionsAmount" DESC;
  `;
  const { rows } = await currentPool.query(sql);
  return rows;
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
  getEntriesUpdatesEnDuble,
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
  getEnDubleDetails,
  getTotalCollisions,
  getTotalCollisionsByProject,
  getProjectTotalWithDelta,
  getTotalStats,
};
