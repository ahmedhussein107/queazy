import json
import os

files = ['data/questions_new.json', 'data/questions.json']
seen_questions = set()
merged_questions = []
id_counter = 1

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            try:
                data = json.load(f)
                for q in data:
                    q_text = q.get('question', '').strip().lower()
                    if q_text and q_text not in seen_questions:
                        seen_questions.add(q_text)
                        
                        # normalize options missing
                        if 'options' not in q:
                            continue
                        
                        # re-assign ID to ensure continuity
                        q['id'] = id_counter
                        id_counter += 1
                        merged_questions.append(q)
            except Exception as e:
                print(f"Error parsing {filepath}: {e}")

with open('data/all_questions.json', 'w') as f:
    json.dump(merged_questions, f, indent=4)

print(f"Merged {len(merged_questions)} unique questions into data/all_questions.json")
