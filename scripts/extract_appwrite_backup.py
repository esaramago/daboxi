import gzip
import re
import json

def parse_sql_values(values_str):
    """
    Parses SQL insert tuples safely handling strings, numbers, NULL, quotes.
    """
    rows = []
    # Tokenizer for SQL tuples
    i = 0
    n = len(values_str)
    
    while i < n:
        # Find start of tuple '('
        while i < n and values_str[i] != '(':
            i += 1
        if i >= n:
            break
        i += 1 # skip '('
        
        row = []
        current_val = []
        in_string = False
        escape = False
        
        while i < n:
            char = values_str[i]
            
            if escape:
                current_val.append(char)
                escape = False
                i += 1
                continue
                
            if char == '\\':
                escape = True
                i += 1
                continue
                
            if char == "'":
                in_string = not in_string
                i += 1
                continue
                
            if not in_string:
                if char == ',':
                    val = "".join(current_val).strip()
                    row.append(val)
                    current_val = []
                    i += 1
                    continue
                elif char == ')':
                    val = "".join(current_val).strip()
                    row.append(val)
                    rows.append(row)
                    i += 1
                    break
            
            current_val.append(char)
            i += 1
            
    return rows

def clean_val(v):
    if v == 'NULL':
        return None
    try:
        if v.startswith("'") and v.endswith("'"):
            v = v[1:-1]
    except:
        pass
    return v

with gzip.open("backup/appwrite-db-backup.sql.gz", "rt", errors="ignore") as f:
    sql = f.read()

def get_table_data(tbl_name):
    m_data = re.search(rf"INSERT INTO `{tbl_name}` VALUES\s*(.*?);", sql, re.DOTALL)
    if not m_data:
        return []
    return parse_sql_values(m_data.group(1))

# 1. Users
users_raw = get_table_data("_2_users")
users = []
for r in users_raw:
    # ['_id', '_uid', '_createdAt', '_updatedAt', '_permissions', 'name', 'email', 'phone', 'status', 'labels', 'passwordHistory', 'password', 'hash', 'hashOptions', 'passwordUpdate', 'prefs', 'registration', 'emailVerification', 'phoneVerification', 'reset', 'mfa', 'mfaRecoveryCodes', 'authenticators', 'sessions', 'tokens', 'challenges', 'memberships', 'targets', 'search', 'accessedAt']
    uid = r[1]
    name = r[5]
    email = r[6]
    prefs_str = r[15]
    try:
        prefs = json.loads(prefs_str)
    except:
        prefs = {}
    users.append({
        "appwriteId": uid,
        "name": name,
        "email": email,
        "prefs": prefs
    })

# 2. Types
# ['_id', '_uid', '_createdAt', '_updatedAt', '_permissions', 'code', 'description']
types_raw = get_table_data("_2_database_1_collection_1")
types = []
for r in types_raw:
    types.append({
        "appwriteId": r[1],
        "code": r[5],
        "description": r[6]
    })

# 3. Categories
# ['_id', '_uid', '_createdAt', '_updatedAt', '_permissions', 'code', 'type', 'description', 'icon']
categories_raw = get_table_data("_2_database_1_collection_2")
categories = []
for r in categories_raw:
    categories.append({
        "appwriteId": r[1],
        "code": r[5],
        "type": r[6],
        "description": r[7],
        "icon": r[8]
    })

# 4. Subcategories
# ['_id', '_uid', '_createdAt', '_updatedAt', '_permissions', 'code', 'description', 'icon', 'category', 'budget']
subcategories_raw = get_table_data("_2_database_1_collection_3")
subcategories = []
for r in subcategories_raw:
    budget = None
    if len(r) > 9 and r[9] != 'NULL':
        try:
            budget = float(r[9])
        except:
            budget = None
    subcategories.append({
        "appwriteId": r[1],
        "code": r[5],
        "description": r[6],
        "icon": r[7],
        "category": r[8],
        "budget": budget
    })

# 5. Transactions
# ['_id', '_uid', '_createdAt', '_updatedAt', '_permissions', 'date', 'refundsIds', 'value', 'netValue', 'description', 'niceDescription', 'subCategory', 'enableBankingId', 'notes']
transactions_raw = get_table_data("_2_database_1_collection_7")
transactions = []
for r in transactions_raw:
    # extract user from permissions
    perms = r[4]
    m_user = re.search(r'user:([a-zA-Z0-9_-]+)', perms)
    user_id = m_user.group(1) if m_user else None
    
    val = float(r[7]) if r[7] != 'NULL' else 0.0
    net_val = float(r[8]) if r[8] != 'NULL' else None
    
    transactions.append({
        "appwriteId": r[1],
        "appwriteUserId": user_id,
        "date": r[5],
        "refundsIds": r[6] if r[6] != 'NULL' else None,
        "value": val,
        "netValue": net_val,
        "description": r[9] if r[9] != 'NULL' else None,
        "niceDescription": r[10] if r[10] != 'NULL' else None,
        "subCategory": r[11] if r[11] != 'NULL' else None,
        "enableBankingId": r[12] if r[12] != 'NULL' else None,
        "notes": r[13] if len(r) > 13 and r[13] != 'NULL' else None
    })

# 6. Bank sessions
# ['_id', '_uid', '_createdAt', '_updatedAt', '_permissions', 'sessionId', 'bankName', 'country', 'accounts', 'validUntil', 'status']
bank_sessions_raw = get_table_data("_2_database_1_collection_8")
bank_sessions = []
for r in bank_sessions_raw:
    perms = r[4]
    m_user = re.search(r'user:([a-zA-Z0-9_-]+)', perms)
    user_id = m_user.group(1) if m_user else None
    bank_sessions.append({
        "appwriteId": r[1],
        "appwriteUserId": user_id,
        "sessionId": r[5] if r[5] != 'NULL' else None,
        "bankName": r[6] if r[6] != 'NULL' else None,
        "country": r[7] if r[7] != 'NULL' else None,
        "accounts": r[8] if r[8] != 'NULL' else None,
        "validUntil": r[9] if r[9] != 'NULL' else None,
        "status": r[10] if len(r) > 10 and r[10] != 'NULL' else None
    })

# 7. Enablebanking transactions
enablebanking_raw = get_table_data("_2_database_1_collection_9")
enablebanking_transactions = []
for r in enablebanking_raw:
    perms = r[4]
    m_user = re.search(r'user:([a-zA-Z0-9_-]+)', perms)
    user_id = m_user.group(1) if m_user else None
    enablebanking_transactions.append({
        "appwriteId": r[1],
        "appwriteUserId": user_id,
        "enableBankingId": r[5] if r[5] != 'NULL' else None,
        "status": r[6] if len(r) > 6 and r[6] != 'NULL' else None
    })

data = {
    "users": users,
    "types": types,
    "categories": categories,
    "subcategories": subcategories,
    "transactions": transactions,
    "bank_sessions": bank_sessions,
    "enablebanking_transactions": enablebanking_transactions
}

with open("scripts/extracted_appwrite_data.json", "w", encoding="utf-8") as out:
    json.dump(data, out, indent=2, ensure_ascii=False)

print(f"Extracted successfully:")
print(f"- Users: {len(users)}")
print(f"- Types: {len(types)}")
print(f"- Categories: {len(categories)}")
print(f"- Subcategories: {len(subcategories)}")
print(f"- Transactions: {len(transactions)}")
print(f"- Bank sessions: {len(bank_sessions)}")
print(f"- EnableBanking txs: {len(enablebanking_transactions)}")

