[[stage(fragment)]]
fn main([[location(0), interpolate(flat)]] center: vec2<f32>) -> [[location(0)]] vec4<f32> {
    if (distance(vpos, center) > 1.0) {
        discard;
    }
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
