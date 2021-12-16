//this builtin(position) clip_position tells that clip_position is the value we want to use for our vertex position or clip position
//it's not needed to create a struct, we could just do [[builtin(position)]] clipPosition
struct VertexOutput{
    [[builtin(position)]] clip_position: vec4<f32>;
};
[[stage(vertex)]]
fn main([[location(0)]] position: vec2<f32>)-> VertexOutput{
    var out:VertexOutput;
    out.clip_position = vec4<f32>(position.x, position.y, 0.0, 1.0); 
    return out;
}