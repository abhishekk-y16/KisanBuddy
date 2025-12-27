path = 'services/vision.py'
with open(path,'r',encoding='utf-8') as f:
    s = f.read()
print('triple_double_count=', s.count('"""'))
print("triple_single_count=", s.count("'''"))
# print surrounding context of all triple double quote occurrences if odd
if s.count('"""') % 2 != 0:
    print('\nListing contexts for all triple-double occurrences:')
    start = 0
    i = 0
    while True:
        idx = s.find('"""', start)
        if idx == -1:
            break
        i += 1
        print(f'-- occurrence {i} at index {idx} --')
        snippet = s[max(0, idx-120): idx+120]
        print(snippet)
        start = idx + 3
