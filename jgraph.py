import random
import json

nodes = []
for i in range(100):
    nodes.append({"name": str(i)})
edges = []
for i in range(5):
    for j in range(100):
        source = random.randint(i * 20, i * 20 + 19)
        target = random.randint(i * 20, i * 20 + 19)
        edges.append({"source": source, "target": target})
# for j in range(4):
#     for i in range(100000):
#         source = random.randint(0, j * 2000)
#         target = random.randint(j * 2000, 19999)
#         edges.append({"source": source, "target": target})
# nodes = []
# edges = []
# for i in range(10):
#     nodes.append({"name": str(i)})
#     if i == 9:
#         edges.append({"source": i, "target": 0})
#     else:
#         edges.append({"source": i, "target": i+1})
graph = {
    "nodes": nodes,
    "edges": edges
}
f = open("test_small.json", "w")
f.write(json.dumps(graph))



