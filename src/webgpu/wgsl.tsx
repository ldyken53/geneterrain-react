export const  compute_terrain = `// compute terrain wgsl
struct Node {
    value : f32;
    x : f32;
    y : f32;
    size : f32;
};
[[block]] struct Nodes {
    nodes : array<Node>;
};
[[block]] struct Uniforms {
  image_width : u32;
  image_height : u32;
  nodes_length : u32;
  width_factor : f32;
  view_box : vec4<f32>;
};
[[block]] struct Pixels {
    pixels : array<f32>;
};
[[block]] struct Range {
    x : atomic<i32>;
    y : atomic<i32>;
};

[[group(0), binding(0)]] var<storage, read> nodes : Nodes;
[[group(0), binding(1)]] var<uniform> uniforms : Uniforms;
[[group(0), binding(2)]] var<storage, write> pixels : Pixels;
[[group(0), binding(3)]] var<storage, read_write> range : Range;

[[stage(compute), workgroup_size(1, 1, 1)]]
fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    var pixel_index : u32 = global_id.x + global_id.y * uniforms.image_width;
    var x : f32 = f32(global_id.x) / f32(uniforms.image_width);
    var y : f32 = f32(global_id.y) / f32(uniforms.image_height);
    x = x * (uniforms.view_box.z - uniforms.view_box.x) + uniforms.view_box.x;
    y = y * (uniforms.view_box.w - uniforms.view_box.y) + uniforms.view_box.y;
    var value : f32 = 0.0;

    for (var i : u32 = 0u; i < uniforms.nodes_length; i = i + 1u) {
        var sqrDistance : f32 = (x - nodes.nodes[i].x) * (x - nodes.nodes[i].x) + (y - nodes.nodes[i].y) * (y - nodes.nodes[i].y);
        value = value + nodes.nodes[i].value / (sqrDistance * uniforms.width_factor + 1.0);
    }
    value = value * 100.0;
    ignore(atomicMin(&range.x, i32(floor(value))));
    ignore(atomicMax(&range.y, i32(ceil(value))));
    pixels.pixels[pixel_index] = value;
}`;
export const  normalize_terrain = `// normalize terrain wgsl
[[block]] struct Uniforms {
  image_width : u32;
  image_height : u32;
  nodes_length : u32;
  width_factor : f32;
};
[[block]] struct Pixels {
    pixels : array<f32>;
};
[[block]] struct Range {
    x : i32;
    y : i32;
};

[[group(0), binding(0)]] var<storage, write> pixels : Pixels;
[[group(0), binding(1)]] var<uniform> uniforms : Uniforms;
[[group(0), binding(2)]] var<storage, read_write> range : Range;

[[stage(compute), workgroup_size(1, 1, 1)]]
fn main([[builtin(global_invocation_id)]] global_id : vec3<u32>) {
    var pixel_index : u32 = global_id.x + global_id.y * uniforms.image_width;
    pixels.pixels[pixel_index] = (pixels.pixels[pixel_index] - f32(range.x)) / f32(range.y - range.x);
}`;
export const  display_2d_vert = `// Vertex shader
struct VertexOutput {
  [[builtin(position)]] Position : vec4<f32>;
  [[location(0)]] fragPosition: vec4<f32>;
};

[[stage(vertex)]]
fn main([[location(0)]] position : vec4<f32>)
     -> VertexOutput {
    var output : VertexOutput;
    output.Position = position;
    output.fragPosition = 0.5 * (position + vec4<f32>(1.0, 1.0, 1.0, 1.0));
    return output;
}


`;
export const  display_2d_frag = `// Fragment shader
[[block]] struct Pixels {
    pixels : array<f32>;
};
[[block]] struct Uniforms {
    peak_value : f32;
    valley_value : f32;
};
[[block]] struct Image {
    width : u32;
    height : u32;
};

[[group(0), binding(0)]] var myTexture: texture_2d<f32>;
[[group(0), binding(1)]] var<storage, read> pixels : Pixels;
[[group(0), binding(2)]] var<uniform> uniforms : Uniforms;
[[group(0), binding(3)]] var<uniform> image_size : Image;

fn outside_grid(p : vec2<u32>) -> bool {
    return any(p == vec2<u32>(u32(0))) || p.x == image_size.width || p.y == image_size.height;
}

[[stage(fragment)]]
fn main([[location(0)]] fragPosition: vec4<f32>) -> [[location(0)]] vec4<f32> {
    var ufragPos : vec4<u32> = vec4<u32>(fragPosition * f32(image_size.width));
    var pixelIndex : u32 = ufragPos.x + ufragPos.y * image_size.width;
    var value : f32 = pixels.pixels[pixelIndex];
    if (!outside_grid(ufragPos.xy)){
        var neighbor_peaks : vec4<bool> = vec4<bool>(
            pixels.pixels[pixelIndex - image_size.width] >= uniforms.peak_value ,
            pixels.pixels[pixelIndex - u32(1)] >= uniforms.peak_value,
            pixels.pixels[pixelIndex + u32(1)] >= uniforms.peak_value,
            pixels.pixels[pixelIndex + image_size.width] >= uniforms.peak_value
        );
        var neighbor_valleys : vec4<bool> = vec4<bool>(
            pixels.pixels[pixelIndex - image_size.width] <= uniforms.valley_value,
            pixels.pixels[pixelIndex - u32(1)] <= uniforms.valley_value,
            pixels.pixels[pixelIndex + u32(1)] <= uniforms.valley_value,
            pixels.pixels[pixelIndex + image_size.width] <= uniforms.valley_value
        ); 
        if (any(neighbor_peaks) && value < uniforms.peak_value) {
            return vec4<f32>(0.8, 0.5, 0.5, 1.0);
        }
        if (any(neighbor_valleys) && value > uniforms.valley_value) {
            return vec4<f32>(0.5, 0.3, 0.3, 1.0);
        }
    }
    var color : vec4<f32> = textureLoad(myTexture, vec2<i32>(i32(value * 180.0), 1), 0);
    return color;
}`;
export const  display_3d_vert = `// Vertex shader
struct VertexOutput {
  [[builtin(position)]] Position : vec4<f32>;
  [[location(0)]] vray_dir: vec3<f32>;
  [[location(1), interpolate(flat)]] transformed_eye: vec3<f32>;
};
[[block]] struct Uniforms {
  proj_view : mat4x4<f32>;
  eye_pos : vec4<f32>;
};
[[group(0), binding(0)]] var<uniform> uniforms : Uniforms;

[[stage(vertex)]]
fn main([[location(0)]] position : vec3<f32>)
     -> VertexOutput {
    var output : VertexOutput;
    var volume_translation : vec3<f32> = vec3<f32>(-0.5, -0.5, -0.5);
    output.Position = uniforms.proj_view * vec4<f32>(position + volume_translation, 1.0);
    output.transformed_eye = uniforms.eye_pos.xyz - volume_translation;
    output.vray_dir = position - output.transformed_eye;
    return output;
}`;
export const  display_3d_frag = `// Fragment shader
[[block]] struct Pixels {
    pixels : array<f32>;
};
[[block]] struct Image {
    width : u32;
    height : u32;
};

[[group(0), binding(1)]] var colormap: texture_2d<f32>;
[[group(0), binding(2)]] var<storage, read> pixels : Pixels;
[[group(0), binding(3)]] var<uniform> image_size : Image;

fn intersect_box(orig : vec3<f32>, dir : vec3<f32>, box_min : vec3<f32>, box_max : vec3<f32>) -> vec2<f32> {
    let inv_dir : vec3<f32> = 1.0 / dir;
    let tmin_tmp : vec3<f32> = (box_min - orig) * inv_dir;
    let tmax_tmp : vec3<f32> = (box_max - orig) * inv_dir;
    var tmin : vec3<f32> = min(tmin_tmp, tmax_tmp);
    var tmax : vec3<f32> = max(tmin_tmp, tmax_tmp);
    var t0 : f32 = max(tmin.x, max(tmin.y, tmin.z));
    var t1 : f32 = min(tmax.x, min(tmax.y, tmax.z));
    return vec2<f32>(t0, t1);
}

fn outside_grid(p : vec3<f32>, volumeDims : vec3<f32>) -> bool {
    return any(p < vec3<f32>(0.0)) || any(p >= volumeDims);
}

[[stage(fragment)]]
fn main(
  [[location(0)]] vray_dir: vec3<f32>, 
  [[location(1), interpolate(flat)]] transformed_eye : vec3<f32>
)-> [[location(0)]] vec4<f32> {
    var ray_dir : vec3<f32> = normalize(vray_dir);
    var longest_axis : f32 = f32(max(image_size.width, image_size.height));
    let volume_dims : vec3<f32> = vec3<f32>(f32(image_size.width), f32(image_size.height), f32(longest_axis));
    let vol_eye : vec3<f32> = transformed_eye * volume_dims;
    let grid_ray_dir : vec3<f32> = normalize(ray_dir * volume_dims);

    var t_hit : vec2<f32> = intersect_box(vol_eye, grid_ray_dir, vec3<f32>(0.0), volume_dims - 1.0);
    if (t_hit.x > t_hit.y) { 
        discard;
    }

    t_hit.x = max(t_hit.x, 0.0);

    var p : vec3<f32> = (vol_eye + t_hit.x * grid_ray_dir);
    p = clamp(p, vec3<f32>(0.0), volume_dims - 2.0);
    let inv_grid_ray_dir : vec3<f32> = 1.0 / grid_ray_dir;
    let start_cell : vec3<f32> = floor(p);
    let t_max_neg : vec3<f32> = (start_cell - vol_eye) * inv_grid_ray_dir;
    let t_max_pos : vec3<f32> = (start_cell + 1.0 - vol_eye) * inv_grid_ray_dir;
    let is_neg_dir : vec3<f32> = vec3<f32>(grid_ray_dir < vec3<f32>(0.0));
    // Pick between positive/negative t_max based on the ray sign
    var t_max : vec3<f32> = mix(t_max_pos, t_max_neg, is_neg_dir);
    let grid_step : vec3<i32> = vec3<i32>(sign(grid_ray_dir));
    // Note: each voxel is a 1^3 box on the grid
    let t_delta : vec3<f32> = abs(inv_grid_ray_dir);

    var t_prev : f32 = t_hit.x;
    // Traverse the grid
    loop {
        if (outside_grid(p, volume_dims)) { break; }
        let v000 : vec3<u32> = vec3<u32>(p);
        var pixel_index : u32 = v000.x + v000.y * image_size.width;
        var value : f32 = pixels.pixels[pixel_index];
        if (f32(v000.z) > longest_axis / 2.0) {
            if (value * longest_axis >= f32(v000.z)) {
                return textureLoad(colormap, vec2<i32>(i32(value * 180.0), 1), 0);
            }
        } elseif (f32(v000.z) < longest_axis / 2.0) {
            if (value * longest_axis <= f32(v000.z)) {
                return textureLoad(colormap, vec2<i32>(i32(value * 180.0), 1), 0);
            }
        } else {
            return textureLoad(colormap, vec2<i32>(i32(value * 180.0), 1), 0);
        }

        let t_next : f32 = min(t_max.x, min(t_max.y, t_max.z));
        t_prev = t_next;
        if (t_next == t_max.x) {
            p.x = p.x + f32(grid_step.x);
            t_max.x = t_max.x + t_delta.x;
        } elseif (t_next == t_max.y) {
            p.y = p.y + f32(grid_step.y);
            t_max.y = t_max.y + t_delta.y;
        } else {
            p.z = p.z + f32(grid_step.z);
            t_max.z = t_max.z + t_delta.z;
        }
    }
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
}

`;
export const  node_vert = `// Vertex shader
struct VertexOutput {
    [[builtin(position)]] Position : vec4<f32>;
    [[location(0)]] position: vec2<f32>;
    [[location(1), interpolate(flat)]] center : vec2<f32>;
};

[[stage(vertex)]]
fn main([[location(0)]] position : vec2<f32>)
     -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(position.x, position.y, 0.0, 1.0);
    output.position = position;
    // flat interpolated position will give bottom right corner, so translate to center
    output.center = position + vec2<f32>(-0.01, 0.01);
    return output;
}`;
export const  node_frag = `[[stage(fragment)]]
fn main([[location(0)]] position: vec2<f32>, [[location(1), interpolate(flat)]] center: vec2<f32>) -> [[location(0)]] vec4<f32> {
    if (distance(position, center) > 0.005) {
        discard;
    }
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}
`;
