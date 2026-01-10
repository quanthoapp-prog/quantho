/**
 * Quantho: External Backup Script
 * This script exports all data from Supabase into JSON files for Disaster Recovery.
 * 
 * Usage: 
 * node .agent/security/backup_tools/backup.js
 * 
 * Required Environment Variables in .env:
 * SUPABASE_URL
 * SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
    'profiles',
    'clients',
    'ateco_codes',
    'transactions',
    'fixed_debts',
    'user_settings',
    'reminders',
    'notifications',
    'contracts',
    'broadcast_messages'
];

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', timestamp);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Starting backup: ${timestamp}`);

    for (const table of TABLES) {
        console.log(`Exporting table: ${table}...`);

        let allData = [];
        let from = 0;
        const step = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .range(from, from + step - 1);

            if (error) {
                console.error(`Error exporting ${table}:`, error.message);
                break;
            }

            allData = allData.concat(data);

            if (data.length < step) {
                hasMore = false;
            } else {
                from += step;
            }
        }

        const filePath = path.join(backupDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
        console.log(`Saved ${allData.length} records to ${filePath}`);
    }

    console.log('Backup completed successfully.');
}

backup().catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
});
