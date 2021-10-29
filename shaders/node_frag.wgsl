[[stage(fragment)]]
fn main([[location(0)]] position: vec2<f32>, [[location(1), interpolate(flat)]] center: vec2<f32>) -> [[location(0)]] vec4<f32> {
    if (distance(position, center) > 0.005) {
        discard;
    }
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}
