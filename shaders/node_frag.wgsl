fn sigmoid(x: f32) -> f32 {
    return 1.0 / (1.0 + exp(-1.0 * x));
}

@stage(fragment)
fn main(@location(0) position: vec2<f32>, @location(1) @interpolate(flat) center: vec2<f32>) -> @location(0) vec4<f32> {
    if (distance(position, center) > 0.005) {
        discard;
    }
    return vec4<f32>(0.0, 0.0, 0.0, 1.0 - sigmoid(16.0 * distance(position, center) * 200.0 - 12.0));
}
