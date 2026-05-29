// White-to-black color scale
const colors = array<vec4f, 6>(
    vec4f(1.0, 1.0, 1.0, 1.0),
    vec4f(0.8, 0.8, 0.8, 1.0),
    vec4f(0.6, 0.6, 0.6, 1.0),
    vec4f(0.4, 0.4, 0.4, 1.0),
    vec4f(0.2, 0.2, 0.2, 1.0),
    vec4f(0.0, 0.0, 0.0, 1.0));

const simWidth = 320u;
const simHeight = 240u;

// Index into colors for the simulation
@group(0) @binding(0) var<storage,read_write> gridDataPing : array<u32, simWidth*simHeight>;
@group(0) @binding(1) var<storage,read_write> gridDataPong : array<u32, simWidth*simHeight>;
@group(0) @binding(2) var<uniform> pingPong: vec2u;
@group(1) @binding(0) var<uniform> viewport: vec2f;

@vertex
fn vertexMain( @location(0) coords: vec2f ) -> @builtin(position) vec4f {
    return vec4f(coords, 0, 1);
}

@fragment
fn fragmentMain( @builtin(position) position: vec4f) -> @location(0) vec4f {
    let offsetPosition = position.xy;
    let percentagePosition = (offsetPosition / viewport);
    // position will be the 0 to viewport pixel coordinate
    // We need to map the sim width and height to that entire view area
    let gridDataIndex = vec2u(percentagePosition * vec2f(f32(simWidth), f32(simHeight)));

    // Then grab the correct color matching to the current simulation index
    let dataIndex = u32(gridDataIndex.y)*simWidth + u32(gridDataIndex.x);

    if (percentagePosition.x < 0 || percentagePosition.y < 0 || percentagePosition.x > 1 || percentagePosition.y > 1) {
        return vec4f(0.0, 1.0, 0.0, 1.0);
    }
    
    if (dataIndex >= simWidth * simHeight || dataIndex < 0)
    {
        return vec4f(1.0, 0.4, 0.4, 1.0);
    }

    var colorIndex: u32;
    if (pingPong.x > 0) {
        colorIndex = gridDataPing[dataIndex];
    } else {
        colorIndex = gridDataPong[dataIndex];
    }

    return colors[colorIndex];
}
