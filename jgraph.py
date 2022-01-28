import random
import json

nodes = []
for i in range(20000):
    nodes.append({"name": str(i)})
edges = []
for i in range(10):
    print(i)
    for j in range(200000):
        source = random.randint(i * 2000, i * 2000 + 1999)
        target = random.randint(i * 2000, i * 2000 + 1999)
        edges.append({"source": source, "target": target})
for j in range(4):
    print(j)
    for i in range(100000):
        source = random.randint(0, j * 2000)
        target = random.randint(j * 2000, 19999)
        edges.append({"source": source, "target": target})
graph = {
    "nodes": nodes,
    "edges": edges
}
f = open("test_multimil.json", "w")
f.write(json.dumps(graph))



