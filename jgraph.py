import random
import json

nodes = []
for i in range(4000):
    nodes.append({"name": str(i)})
edges = []
for i in range(8):
    for j in range(10000):
        source = random.randint(i * 500, i * 500 + 499)
        target = random.randint(i * 500, i * 500 + 499)
        edges.append({"source": source, "target": target})
for i in range(10000):
    source = random.randint(0, 2200)
    target = random.randint(0, 2200)
    edges.append({"source": source, "target": target})
for i in range(10000):
    source = random.randint(1800, 3999)
    target = random.randint(1800, 3999)
    edges.append({"source": source, "target": target})
graph = {
    "nodes": nodes,
    "edges": edges
}
f = open("test_100000.json", "w")
f.write(json.dumps(graph))



