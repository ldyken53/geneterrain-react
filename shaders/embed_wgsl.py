#!/usr/bin/env python3
shaders = [
    "triangle_vert.wgsl",
    "triangle_frag.wgsl",
]
compiled_shaders = ""

for shader in shaders:
    with open(shader, "r") as f:
        compiled_code = f.read()
        compiled_shaders += f"export const  {shader[:-5]} = `{compiled_code}`;\n"

with open("../src/wgsl.tsx", "w") as f:
    f.write(compiled_shaders)

