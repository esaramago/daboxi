#!/usr/bin/env python3
import os
import shutil
import sqlite3
import sys

def main():
    db_path = os.path.join(os.path.dirname(__file__), '..', 'pb_data', 'data.db')
    db_path = os.path.abspath(db_path)

    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}", file=sys.stderr)
        sys.exit(1)

    backup_path = db_path + '.bak'
    print(f"1. Creating backup at {backup_path}...")
    shutil.copy2(db_path, backup_path)
    print("Backup created successfully.")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM transactions WHERE date LIKE '% 23:00:00.000Z'")
    count_before = cursor.fetchone()[0]
    print(f"2. Found {count_before} transactions with '23:00:00.000Z'.")

    if count_before == 0:
        print("No transactions need fixing. Exiting.")
        conn.close()
        return

    # Update: add 1 hour to all timestamps with 23:00:00.000Z
    cursor.execute("""
        UPDATE transactions
        SET date = strftime('%Y-%m-%d %H:%M:%S.000Z', datetime(substr(date, 1, 19), '+1 hour'))
        WHERE date LIKE '% 23:00:00.000Z'
    """)
    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM transactions WHERE date LIKE '% 23:00:00.000Z'")
    count_after_23 = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM transactions WHERE date LIKE '% 00:00:00.000Z'")
    count_00 = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM transactions")
    total = cursor.fetchone()[0]

    print(f"3. Migration completed:")
    print(f"   - Transactions still with 23:00:00.000Z: {count_after_23}")
    print(f"   - Transactions now with 00:00:00.000Z: {count_00} (out of {total} total)")

    conn.close()
    print("Done!")

if __name__ == '__main__':
    main()

