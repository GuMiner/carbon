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

fn getValue(x: i32, y: i32) -> i32 {
    if (x < 0 || y < 0 || x >= i32(simWidth) || y >= i32(simHeight)) {
        return 1;
    }

    let index = x + y * i32(simWidth);
    if (pingPong.x > 0) {
        if (gridDataPing[index] == 5) {
            return 1;
        }
    } else {
        if (gridDataPong[index] == 5) {
            return 1;
        }
    }

    return 0;
}

fn countNeighbours(x: i32, y: i32) -> i32 {
    var count = 0;

    for (var yn: i32 = y - 1; yn <= y + 1; yn++) { 
        for (var xn: i32 = x - 1; xn <= x + 1; xn++) {
            count += getValue(xn, yn);
        }
    }

    count -= getValue(x, y);
    return count;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id : vec3u) {
    let cell = id.xy;
    if (cell.x >= simWidth || cell.y >= simHeight) {
        return;
    }

    let count = countNeighbours(i32(cell.x), i32(cell.y));

    let index = cell.x + cell.y * simWidth;

    // TODO figure out how to properly use array pointers in Web GPU
    if (pingPong.x > 0)
    {
        let isAlive = (gridDataPing[index] == 5);
        if ((isAlive && (count == 2 || count == 3)) ||
            (!isAlive && count == 3)) {
            gridDataPong[index] = 5;
        } else if (gridDataPing[index] != 0) {
            gridDataPong[index] = gridDataPing[index] - 1;
        } else {
            gridDataPong[index] = 0;
        }
        //let readValue = gridDataPing[index];
        //gridDataPong[index] = (readValue + gridDataPing[index - 10] + gridDataPing[index + 3]) % 6;
    } else {
        let isAlive = (gridDataPong[index] == 5);
        if ((isAlive && (count == 2 || count == 3)) ||
            (!isAlive && count == 3)) {
            gridDataPing[index] = 5;
        } else if (gridDataPong[index] != 0) {
            gridDataPing[index] = gridDataPong[index] - 1;
        } else {
            gridDataPing[index] = 0;
        }

        //let readValue = gridDataPong[index];
        //gridDataPing[index] = (readValue + gridDataPong[index - 10] + gridDataPong[index + 3]) % 6;
    }
}
