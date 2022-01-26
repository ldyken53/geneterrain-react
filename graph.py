import random

class Node:
    def __init__(self, k, v, x, y, size):
        self.k = k
        self.v = v
        self.x = x
        self.y = y
        self.size = size

nodes = []
<<<<<<< HEAD
for i in range(30):
=======
for i in range(1031):
>>>>>>> 50be5a5424db75fe85809ac81c1eeaedc9983d87
    nodes.append(Node(i, random.uniform(0, 1), random.uniform(0, 1), random.uniform(0, 1), 1))
f = open("e1.txt", "w")
for node in nodes:
    out = f"{node.k}\t{node.v}\n"
    f.write(out)
f = open("l1.txt", "w")
for node in nodes:
    out = f"{node.k}\t{node.x}\t{node.y}\t{node.size}\n"
    f.write(out)
f = open("n1.txt", "w")
<<<<<<< HEAD
for i in range(19):
    out = f"{nodes[i].k}\t{nodes[i+1].k}\t1\n"
    f.write(out)
    out = f"{nodes[i].k}\t{nodes[i+2].k}\t1\n"
    f.write(out)
    out = f"{nodes[i].k}\t{nodes[i+3].k}\t1\n"
    f.write(out)
    out = f"{nodes[i].k}\t{nodes[i+4].k}\t1\n"
    f.write(out)
    out = f"{nodes[i].k}\t{nodes[i+5].k}\t1\n"
    f.write(out)
    out = f"{nodes[i].k}\t{nodes[i+6].k}\t1\n"
    f.write(out)
    out = f"{nodes[i].k}\t{nodes[i+7].k}\t1\n"
    f.write(out)
    out = f"{nodes[i].k}\t{nodes[i+8].k}\t1\n"
    f.write(out)
    out = f"{nodes[i].k}\t{nodes[i+9].k}\t1\n"
    f.write(out)
    out = f"{nodes[i].k}\t{nodes[i+10].k}\t1\n"
    f.write(out)
=======
for i in range(1030):
    for j in range(i+1, 1031):
        out = f"{nodes[i].k}\t{nodes[j].k}\t1\n"
        f.write(out)


>>>>>>> 50be5a5424db75fe85809ac81c1eeaedc9983d87
