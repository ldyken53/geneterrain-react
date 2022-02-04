import random
import json

nodes = []
for i in range(10000):
    nodes.append({"name": str(i)})
edges = []
for i in range(5):
    for j in range(100000):
        source = random.randint(i * 2000, i * 2000 + 1999)
        target = random.randint(i * 2000, i * 2000 + 1999)
for j in range(4):
    for i in range(100000):
        source = random.randint(0, j * 2000)
        target = random.randint(j * 2000, 19999)
        edges.append({"source": source, "target": target})
graph = {
    "nodes": nodes,
    "edges": edges
}
f = open("test_mil.json", "w")
f.write(json.dumps(graph))



