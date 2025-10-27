import { neon } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';


// Use environment variables for database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create SQL query client
const sql = neon(connectionString);

// Create connection pool for more complex operations
const pool = new Pool({ connectionString });

// Enhanced interface for filtering records with support for logical operators
export interface FilterCriteria {
  [key: string]: unknown | { 
    '>=': number | string;
    '<=': number | string;
    '<': number | string;
    '>': number | string;
    '!=': unknown;
    '$is': unknown;
    '$isnot': unknown;
    '$like': string;
    '$in': unknown[];
    [key: string]: unknown; 
  } | FilterCriteria[];
  $or?: FilterCriteria[];
  $and?: FilterCriteria[];
}

// Interface for database records
export interface Record {
  [key: string]: unknown;
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Enhanced helper to build WHERE conditions with operators
function buildWhereConditions(criteria: FilterCriteria, startParamIndex = 1): { 
  conditions: string; 
  values: unknown[];
  paramIndex: number;
} {
  const values: unknown[] = [];
  let paramIndex = startParamIndex;
  const conditions: string[] = [];

  // Process all criteria including logical operators
  for (const [key, value] of Object.entries(criteria)) {
    if (key === '$or' && Array.isArray(value)) {
      const orConditions = value.map(subCriteria => {
        const result = buildWhereConditions(subCriteria, paramIndex);
        paramIndex = result.paramIndex;
        values.push(...result.values);
        return `(${result.conditions})`;
      });
      if (orConditions.length > 0) {
        conditions.push(`(${orConditions.join(' OR ')})`); 
      }
    } else if (key === '$and' && Array.isArray(value)) {
      const andConditions = value.map(subCriteria => {
        const result = buildWhereConditions(subCriteria, paramIndex);
        paramIndex = result.paramIndex;
        values.push(...result.values);
        return `(${result.conditions})`;
      });
      if (andConditions.length > 0) {
        conditions.push(`(${andConditions.join(' AND ')})`); 
      }
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Handle operator conditions (>, <, >=, <=, !=, $like, $in)
      const operatorConditions = Object.entries(value as { [key: string]: unknown }).map(([op, opValue]) => {
        if (op === '$in' && Array.isArray(opValue)) {
          // Handle $in operator with array values
          const placeholders = opValue.map(() => `$${paramIndex++}`).join(', ');
          values.push(...opValue);
          return `"${key}" IN (${placeholders})`;
        }
        values.push(opValue);
        if (op === '$like') {
          return `"${key}" ILIKE $${paramIndex++}`;
        }
        return `"${key}" ${op} $${paramIndex++}`;
      });
      if (operatorConditions.length > 0) {
        conditions.push(`(${operatorConditions.join(' AND ')})`); 
      }
    } else if (value === 'IS_NULL') {
      conditions.push(`"${key}" IS NULL`);
    } else if (value === 'IS_NOT_NULL') {
      conditions.push(`"${key}" IS NOT NULL`);
    } else {
      // Regular equality comparison
      values.push(value);
      conditions.push(`"${key}" = $${paramIndex++}`);
    }
  }

  return { 
    conditions: conditions.length > 0 ? conditions.join(' AND ') : 'TRUE',
    values, 
    paramIndex 
  };
}

// Database utility object
export const db = {
  // Find a single record
  async findOne<T = Record>(tableName: string, criteria: FilterCriteria = {}): Promise<T | null> {
    const keys = Object.keys(criteria);
    
    if (keys.length === 0) {
      const result = await sql`SELECT * FROM "${tableName}" LIMIT 1`;
      return result[0] as T || null;
    }
    
    // Use the enhanced condition builder
    const { conditions, values } = buildWhereConditions(criteria);
    
    const query = `
      SELECT * FROM "${tableName}"
      WHERE ${conditions}
      LIMIT 1
    `;
    
    console.log('Query:', query);
    console.log('Values:', values);
    
    const result = await pool.query(query, values);
    return result.rows[0] as T || null;
  },
  
  // Find a record by ID
  async findById<T = Record>(tableName: string, id: string | number): Promise<T | null> {
    return this.findOne<T>(tableName, { id });
  },
  
  // Find multiple records with support for operators
  async find<T = Record>(
    tableName: string, 
    criteria: FilterCriteria = {}, 
    options: { 
      limit?: number; 
      offset?: number; 
      orderBy?: string; 
      order?: 'ASC' | 'DESC';
      join?: {
        table: string;
        on: string;
        type: 'LEFT' | 'INNER' | 'RIGHT';
      };
      distinct?: boolean;
      select?: string[];
      groupBy?: string;
    } = {}
  ): Promise<T[]> {
    const { limit, offset, orderBy, order, join, select, groupBy, distinct } = options;
    
    // Build the base query
    let queryStr = 'SELECT ';
    
    // Add DISTINCT if specified
    if (distinct) {
      queryStr += 'DISTINCT ';
    }
    
    // Add select fields
    if (select && select.length > 0) {
      queryStr += select.join(', ');
    } else {
      queryStr += `${tableName}.*`;
    }
    
    // Add FROM clause
    queryStr += ` FROM ${tableName}`;
    
    // Add JOIN if specified
    if (join) {
      queryStr += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    }
    
    // Add WHERE clause if criteria exists
    const values: unknown[] = [];
    if (Object.keys(criteria).length > 0) {
      const { conditions } = buildWhereConditions(criteria);
      queryStr += ` WHERE ${conditions}`;
      values.push(...buildWhereConditions(criteria).values);
    }
    
    // Add GROUP BY if specified
    if (groupBy) {
      queryStr += ` GROUP BY ${groupBy}`;
    }
    
    // Add ORDER BY if specified
    if (orderBy) {
      queryStr += ` ORDER BY ${orderBy} ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    }
    
    // Add LIMIT and OFFSET
    let paramIndex = values.length + 1;
    
    if (limit) {
      queryStr += ` LIMIT $${paramIndex}`;
      values.push(limit);
      paramIndex++;
    }
    
    if (offset) {
      queryStr += ` OFFSET $${paramIndex}`;
      values.push(offset);
    }
    
    console.log('Query:', queryStr);
    console.log('Values:', values);
    
    const result = await pool.query(queryStr, values);
    return result.rows;
  },
  
  // Find all records
  async findAll(
    tableName: string, 
    options: { 
      limit?: number; 
      offset?: number; 
      orderBy?: string; 
      order?: 'ASC' | 'DESC' 
    } = {}
  ): Promise<Record[]> {
    return this.find(tableName, {}, options);
  },
  
  // Count records with support for operators
  async count(tableName: string, criteria: FilterCriteria = {}): Promise<number> {
    console.log('Count criteria:', criteria);
    if (Object.keys(criteria).length === 0) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      return result.rows[0]?.count ? Number(result.rows[0].count) : 0;
    }
    
    // Use the enhanced condition builder
    const { conditions, values } = buildWhereConditions(criteria);
    
    const query = `
      SELECT COUNT(*) as count FROM "${tableName}"
      WHERE ${conditions}
    `;

    console.log('Query:', query);
    console.log('Values:', values);
    
    const result = await pool.query(query, values);
    return result.rows[0]?.count ? Number(result.rows[0].count) : 0;
  },
  
  // Insert a new record
  async create<T = Record>(tableName: string, data: Partial<T>): Promise<T & {id: number}> {
    const keys = Object.keys(data);
    const values = keys.map(key => data[key as keyof T]);
    
    const columns = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO "${tableName}" (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Upsert a record (insert or update on conflict)
  async upsert<T = Record>(
    tableName: string, 
    data: Partial<T>, 
    conflictColumns: string[],
    updateColumns?: string[]
  ): Promise<T & {id: number}> {
    const keys = Object.keys(data);
    const values = keys.map(key => data[key as keyof T]);
    
    const columns = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    // Build conflict clause
    const conflictClause = conflictColumns.join(', ');
    
    // Build update clause
    let updateClause = '';
    if (updateColumns && updateColumns.length > 0) {
      const updateParts = updateColumns
        .filter(col => keys.includes(col))
        .map(col => `"${col}" = EXCLUDED."${col}"`)
        .join(', ');
      if (updateParts) {
        updateClause = `UPDATE SET ${updateParts}`;
      }
    } else {
      // Update all columns except the conflict ones
      const updateParts = keys
        .filter(key => !conflictColumns.includes(key))
        .map(key => `"${key}" = EXCLUDED."${key}"`)
        .join(', ');
      if (updateParts) {
        updateClause = `UPDATE SET ${updateParts}`;
      }
    }
    
    // Build the final query
    let query = `
      INSERT INTO "${tableName}" (${columns})
      VALUES (${placeholders})
      ON CONFLICT (${conflictClause})
    `;
    
    if (updateClause) {
      query += ` DO ${updateClause}`;
    } else {
      query += ` DO NOTHING`;
    }
    
    query += ` RETURNING *`;
    
    console.log('Upsert Query:', query);
    console.log('Upsert Values:', values);
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async createMany<T = Record>(tableName: string, data: Partial<T>[]): Promise<T[]> {
    if (!data.length) {
      return [];
    }

    const columns = Object.keys(data[0]).join(', ');
    const values: unknown[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    // Build values array and placeholders
    data.forEach((item) => {
      const rowValues = Object.values(item);
      const rowPlaceholders = rowValues.map(() => `$${paramIndex++}`).join(', ');
      values.push(...rowValues);
      placeholders.push(`(${rowPlaceholders})`);
    });

    const query = `
      INSERT INTO "${tableName}" (${columns})
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    console.log('Query:', query);
    console.log('Values:', values);

    const result = await pool.query(query, values);
    return result.rows;
  },
  
  // Update records
  async update(
    tableName: string, 
    criteria: FilterCriteria, 
    data: Record
  ): Promise<[number, Record[]]> {
    if (Object.keys(criteria).length === 0) {
      throw new Error('Cannot update without criteria');
    }

    // Special handling for careInstructions and deliveryTime fields
    // Ensure we're using snake_case column names in database operations
    if (tableName === 'products') {
      // Convert camelCase to snake_case if present
      if ('careInstructions' in data) {
        data.care_instructions = data.careInstructions;
        delete data.careInstructions;
      }
      
      if ('deliveryTime' in data) {
        data.delivery_time = data.deliveryTime;
        delete data.deliveryTime;
      }
      
      // Ensure values are not null or undefined
      if ('care_instructions' in data) {
        data.care_instructions = data.care_instructions ?? '';
      }
      
      if ('delivery_time' in data) {
        data.delivery_time = data.delivery_time ?? '';
      }
    }
    
    // Recalculate keys after potential field conversions
    const dataKeys = Object.keys(data);
    
    if (dataKeys.length === 0) {
      console.log('No data keys found, skipping update');
      return [0, []];
    }
    
    // Build SET clause for update
    const setClauses = dataKeys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
    
    // Use the enhanced condition builder for WHERE clause
    // We need to offset the parameter index by the number of data fields
    const { conditions, values: whereValues } = buildWhereConditions(criteria, dataKeys.length + 1);
    
    const query = `
      UPDATE "${tableName}"
      SET ${setClauses}
      WHERE ${conditions}
      RETURNING *
    `;
    
    // Combine data values with where clause values
    const values = [...dataKeys.map(key => data[key]), ...whereValues];
    
    console.log('Query:', query);
    console.log('Values:', values);

    try {
      const result = await pool.query(query, values);

      // Debug the returned data
      if (result.rows && result.rows.length > 0) {
        console.log('First updated row:', result.rows[0]);
      }
      
      return [result.rowCount || 0, result.rows];
    } catch (error) {
      console.error('Error during update operation:', error);
      throw error;
    }
  },
  
  // Delete records
  async destroy(tableName: string, criteria: FilterCriteria): Promise<number> {
    if (Object.keys(criteria).length === 0) {
      throw new Error('Cannot delete without criteria');
    }
    
    // Use the enhanced condition builder
    const { conditions, values } = buildWhereConditions(criteria);
    
    const query = `
      DELETE FROM "${tableName}"
      WHERE ${conditions}
      RETURNING *
    `;
    
    console.log('Query:', query);
    console.log('Values:', values);
    
    const result = await pool.query(query, values);
    return result.rowCount || 0;
  },
  
  // Execute raw query
  async query<T = Record[]>(queryText: string, values: unknown[] = []): Promise<T> {
    console.log('Query:', queryText);
    console.log('Values:', values);
    const result = await pool.query(queryText, values);
    return result.rows as unknown as T;
  },
  
  // Initialize database tables
  async initializeTables(): Promise<void> {
    // Check if products table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'products'
      ) as exists
    `);
    
    const tableExists = tableCheck.rows[0]?.exists;
    
    if (!tableExists) {
      // Create products table if it doesn't exist - with NUMERIC price and featured column
      await sql`
        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price NUMERIC(10,2) NOT NULL,
          images TEXT[] NOT NULL DEFAULT '{}',
          category VARCHAR(100) NOT NULL,
          description TEXT,
          details TEXT[] DEFAULT '{}',
          care_instructions TEXT,
          delivery_time VARCHAR(100),
          featured BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      console.log('Products table created with NUMERIC price and featured fields');
    }
    
    const tableCheckCourses = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'courses'
      ) as exists
    `);
    
    const tableExistsCourses = tableCheckCourses.rows[0]?.exists;
    
    if (!tableExistsCourses) {
    // Create courses table
    await sql`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        max_price DECIMAL NOT NULL,
        discounted_price DECIMAL NOT NULL,
        discount_percentage DECIMAL NOT NULL,
        description TEXT NOT NULL,
        images TEXT[] NOT NULL,
        is_online_course BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    } else {
      console.log('courses table already exists');
    }

    const tableCheckSubjects = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subjects'
      ) as exists
    `);

    const tableExistsSubjects = tableCheckSubjects.rows[0]?.exists;

    if (!tableExistsSubjects) {
      // Create subjects table
      await sql`
        CREATE TABLE IF NOT EXISTS subjects (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          images TEXT[] NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create course_subjects junction table
      await sql`
        CREATE TABLE IF NOT EXISTS course_subjects (
          course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (course_id, subject_id)
        );
      `;
    }

    const tableCheckGallery = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'gallery'
      ) as exists
    `);

    const tableExistsGallery = tableCheckGallery.rows[0]?.exists;

    if (!tableExistsGallery) {
      // Create gallery table
      await sql`
        CREATE TABLE IF NOT EXISTS gallery (
          id SERIAL PRIMARY KEY,
          image_url TEXT NOT NULL,
          display_order INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
    }


    const tableCheckRegistrations = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'course_registrations'
      ) as exists
    `);

    const tableExistsRegistrations = tableCheckRegistrations.rows[0]?.exists;

    if (!tableExistsRegistrations) {
      await sql`
        CREATE TABLE IF NOT EXISTS course_registrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          address TEXT NOT NULL,
          phone VARCHAR(20) NOT NULL UNIQUE,
          email VARCHAR(255) NULL,
          highest_qualification VARCHAR(255),
          aadhar_number VARCHAR(12),
          date_of_birth DATE,
          profession VARCHAR(255),
          terms_accepted BOOLEAN NOT NULL DEFAULT false,
          course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
          course_title VARCHAR(255) NOT NULL,
          amount_due NUMERIC(10, 2) NOT NULL,
          status VARCHAR(50) NOT NULL,
          order_number VARCHAR(6) UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
    } else {
      await sql`
        ALTER TABLE course_registrations
        ALTER COLUMN email DROP NOT NULL;
      `;

      // Drop unique constraint on email if it exists
      await sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conrelid = 'course_registrations'::regclass
              AND contype = 'u'
              AND conkey = ARRAY[
                (SELECT attnum FROM pg_attribute WHERE attrelid = 'course_registrations'::regclass AND attname = 'email')
              ]
          ) THEN
            ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_email_key;
          END IF;
        END
        $$;
      `;

      // Add order_number column if it doesn't exist
      await sql`
        ALTER TABLE course_registrations
        ADD COLUMN IF NOT EXISTS order_number VARCHAR(6) UNIQUE;
      `;

      try{
      // Check if order_number column exists in payments table
      const columnExists = await pool.query(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns 
          WHERE table_name = 'payments' 
          AND column_name = 'order_number'
        ) as exists
      `);
      
      const orderNumberColumnExists = columnExists.rows[0]?.exists;
      
      if (orderNumberColumnExists) {
        // Migrate existing order numbers from payments table to course_registrations
        // Only for payments with 'captured' status
        await sql`
          UPDATE course_registrations 
          SET order_number = payments.order_number
          FROM payments 
          WHERE course_registrations.id = payments.registration_id 
          AND payments.status = 'captured' 
          AND payments.order_number IS NOT NULL
          AND course_registrations.order_number IS NULL;
        `;
        console.log('Migrated existing order numbers from payments table');
      } else {
        console.log('order_number column does not exist in payments table, will generate new order numbers');
      }
      
      // Generate order numbers for any course_registrations that don't have one
      const registrationsWithoutOrderNumber = await pool.query(`
        SELECT id FROM course_registrations 
        WHERE order_number IS NULL
        ORDER BY id
      `);
      
      if (registrationsWithoutOrderNumber.rows.length > 0) {
        console.log(`Found ${registrationsWithoutOrderNumber.rows.length} registrations without order numbers, generating new ones...`);
        
        // Import the order number generator
        const { generateUniqueOrderNumber } = await import('@/lib/orderUtils');
        
        for (const row of registrationsWithoutOrderNumber.rows) {
          try {
            const orderNumber = await generateUniqueOrderNumber(async (orderNum) => {
              const existing = await db.findOne('course_registrations', { order_number: orderNum });
              return !!existing;
            });
            
            await sql`
              UPDATE course_registrations 
              SET order_number = ${orderNumber}
              WHERE id = ${row.id}
            `;
          } catch (error) {
            console.error(`Failed to generate order number for registration ${row.id}:`, error);
          }
        }
        
        console.log('Generated order numbers for all registrations without them');
      }
      
      } catch (error) {
        console.log('course_registrations table migration failed:', error);
      }

      console.log('course_registrations table already exists');
    }

    const tableCheckPayments = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payments'
      ) as exists
    `);

    const tableExistsPayments = tableCheckPayments.rows[0]?.exists;

    if (!tableExistsPayments) {
      await sql`
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          registration_id INTEGER NOT NULL REFERENCES course_registrations(id) ON DELETE CASCADE,
          razorpay_payment_id VARCHAR(255),
          razorpay_order_id VARCHAR(255),
          razorpay_signature VARCHAR(255),
          amount NUMERIC(10, 2) NOT NULL,
          currency VARCHAR(10) NOT NULL,
          status VARCHAR(50) NOT NULL,
          coupon_code VARCHAR(50),
          -- Additional payment data from webhook
          invoice_id VARCHAR(255),
          payment_method VARCHAR(50),
          amount_refunded NUMERIC(10, 2) DEFAULT 0,
          refund_status VARCHAR(50),
          description TEXT,
          card_id VARCHAR(255),
          bank VARCHAR(50),
          wallet VARCHAR(50),
          vpa VARCHAR(255),
          captured BOOLEAN DEFAULT false,
          fee NUMERIC(10, 2) DEFAULT 0,
          tax NUMERIC(10, 2) DEFAULT 0,
          error_code VARCHAR(100),
          error_description TEXT,
          error_source VARCHAR(50),
          error_step VARCHAR(50),
          error_reason VARCHAR(50),
          acquirer_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
    } else {
      // Add UUID extension and migrate existing payments table
      try {
        // Enable UUID extension
        await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

      } catch (error) {
        console.log('Payments table migration failed:', error);
      }
    }

    const tableCheckWhatsAppMessages = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'whatsapp_messages'
      ) as exists
    `);

    const tableExistsWhatsAppMessages = tableCheckWhatsAppMessages.rows[0]?.exists;

    if (!tableExistsWhatsAppMessages) {
      await sql`
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id SERIAL PRIMARY KEY,
          message_id VARCHAR(255) UNIQUE,
          from_number VARCHAR(20) NOT NULL,
          to_number VARCHAR(20) NOT NULL,
          business_account_id VARCHAR(50) NOT NULL,
          message_type VARCHAR(50) NOT NULL DEFAULT 'text',
          content TEXT NOT NULL,
          direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
          status VARCHAR(50) DEFAULT 'sent',
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create indexes for better performance
      await sql`
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to_number ON whatsapp_messages(to_number);
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_business_account_id ON whatsapp_messages(business_account_id);
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
      `;
    }
    
    console.log('Database tables initialized');
  }
};

db.initializeTables();