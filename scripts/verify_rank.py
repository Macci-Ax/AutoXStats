import urllib.request
import json

try:
    print("Fetching drivers from API...")
    res = urllib.request.urlopen('http://localhost:3000/api/drivers').read()
    data = json.loads(res)
    
    print(f"Total entries: {len(data)}")
    
    # Check Tobias Hönicke
    entries = [d for d in data if 'Hönicke' in d['driver']['name']]
    
    print("\n=== Entries for Hönicke ===")
    for e in entries:
        print(f"Name: {e['driver']['name']}")
        print(f"Prop Class: {e['driverClass']}")
        print(f"Internal Class ID: {e.get('_classId', 'MISSING')}")
        print(f"Points: {e['stats']['points']}")
        print(f"Rank: {e['stats']['seasonRank']}")
        print(f"Championships: {e['championships']}")
        print("-" * 20)
        
except Exception as e:
    print(f"Error: {e}")
