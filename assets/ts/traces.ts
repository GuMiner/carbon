// WebGPU Traces — Conway's Game of Life with compute shaders
// Merged from lithium: js/traces.ts + js/traces/utility.ts + js/traces/mode.ts

/* ------------------------------------------------------------------ */
//  GPUHelper utilities                                                 //
/* ------------------------------------------------------------------ */

function renderErrorMessage(canvas: HTMLCanvasElement, ...errorMessages: String[]) {
    const context = canvas.getContext("2d");
    if (!context) return;

    context.font = "20px Helvetica";
    let yOffset = 40;
    for (let errorMessage of errorMessages) {
        context.fillText(errorMessage, 10, yOffset);
        yOffset = yOffset + 28;
    }
}

async function getFile(url: string): Promise<string> {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
        console.error(`HTTP ${response.status} ${await response.text()}`);
        return "";
    }

    return await response.text();
}

export namespace GPUHelper {
    export async function getWebGPUDevice(canvas: HTMLCanvasElement): Promise<GPUDevice> {
        if (!navigator.gpu) {
            renderErrorMessage(canvas, "WebGPU is not supported in this browser.",
                "If on Firefox, enable WebGPU by:",
                " - Navigating to 'about:config'",
                " - Enabling 'dom.webgpu.enabled'"
            );
            return null;
        }

        let adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            renderErrorMessage(canvas, "WebGPU is supported, but this app was unable to get the WebGPU adapter.");
            return null;
        }

        let device = await adapter.requestDevice();
        return device;
    }

    export async function loadShader(device: GPUDevice, shaderUri: string): Promise<GPUShaderModule> {
        const shaderSource = await getFile(shaderUri);

        device.pushErrorScope("validation");
        const shader = device.createShaderModule({ code: shaderSource });

        let error = await device.popErrorScope();
        if (error) {
            throw Error("Compilation error in shader!");
        }

        return shader;
    }

    export function createRenderPassDescriptor(context: GPUCanvasContext): GPURenderPassDescriptor {
        let colorAttachment: GPURenderPassColorAttachment = {
            clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
            loadOp: "clear",
            storeOp: "store",
            view: context.getCurrentTexture().createView()
        };

        return { colorAttachments: [colorAttachment] };
    }
}

/* ------------------------------------------------------------------ */
//  Mode                                                                //
/* ------------------------------------------------------------------ */

export enum Mode {
    Grid = 1,
    Triangle = 2
}

export var GlobalMode: Mode = Mode.Grid;

window.addEventListener('keydown', (ev) => {
    if (ev.key == "2") {
        GlobalMode = Mode.Triangle;
    } else if (ev.key == "1") {
        GlobalMode = Mode.Grid;
    }
});

(window as any).triangleMode = triangleMode;
(window as any).simMode = simMode;

function triangleMode() {
    GlobalMode = Mode.Triangle;
}

function simMode() {
    GlobalMode = Mode.Grid;
}

/* ------------------------------------------------------------------ */
//  Programs                                                            //
/* ------------------------------------------------------------------ */

var canvasDiv: HTMLDivElement = null;
var canvas: HTMLCanvasElement = null;

interface Program {
    vertexBuffer: GPUBuffer;
    vertexCount: number;
    uniformBuffer: GPUBuffer;
    bindGroups: GPUBindGroup[];
    pipeline: GPURenderPipeline;
}

class GridProgram implements Program {
    shader: GPUShaderModule;
    computeShader: GPUShaderModule;

    vertexBuffer: GPUBuffer;
    vertexCount: number;

    uniformBuffer: GPUBuffer;
    uniformBindGroup: GPUBindGroup;

    pingPongBuffer: GPUBuffer;

    gridBufferPing: GPUBuffer;
    gridBufferPong: GPUBuffer;
    gridBufferBindGroup: GPUBindGroup;

    bindGroups: GPUBindGroup[];

    pipeline: GPURenderPipeline;

    computePipeline: GPUComputePipeline;
    computeBindGroup: GPUBindGroup;
    computeWorkgroupsX: number;
    computeWorkgroupsY: number;

    readonly simWidth = 320;
    readonly simHeight = 240;

    protected constructor(shader: GPUShaderModule, computeShader: GPUShaderModule) {
        this.shader = shader;
        this.computeShader = computeShader;

        this.uniformBuffer = device.createBuffer({
            label: "ViewportBuffer",
            size: 2 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.pingPongBuffer = device.createBuffer({
            label: "PingPongBuffer",
            size: 2 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.gridBufferPing = device.createBuffer({
            label: "GridBuffer",
            size: 4*this.simWidth*this.simHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });
        this.gridBufferPong = device.createBuffer({
            label: "GridBuffer",
            size: 4*this.simWidth*this.simHeight,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        });

        let uniformFragmentLayout: GPUBindGroupLayoutEntry = {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
        };
        let uniformBindGroupLayout = device.createBindGroupLayout({ entries: [uniformFragmentLayout] });

        this.uniformBindGroup = device.createBindGroup({
            label: "UniformBindGroup",
            layout: uniformBindGroupLayout,
            entries: [{
                    binding: 0,
                    resource: { buffer: this.uniformBuffer, offset: 0, size: 2 * 4 }
                },
            ]
        });

        let storageFragmentLayout: GPUBindGroupLayoutEntry = {
            binding: 0,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: { type: "storage" },
        };
        let storageFragmentLayout2: GPUBindGroupLayoutEntry = {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: { type: "storage" },
        };
        let uniformFragmentLayout2: GPUBindGroupLayoutEntry = {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
        };
        let gridBufferBindGroupLayout = device.createBindGroupLayout({ entries: [storageFragmentLayout,storageFragmentLayout2,uniformFragmentLayout2] });

        this.gridBufferBindGroup = device.createBindGroup({
            label: "GridBufferBindGroup",
            layout: gridBufferBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.gridBufferPing, offset: 0, size: 4*this.simWidth*this.simHeight }
            },
            {
                binding: 1,
                resource: { buffer: this.gridBufferPong, offset: 0, size: 4*this.simWidth*this.simHeight }
            },
            {
                binding: 2,
                resource: { buffer: this.pingPongBuffer, offset: 0, size: 2 * 4 }
            },
            ]
        });

        this.bindGroups = [this.gridBufferBindGroup, this.uniformBindGroup];

        this.populateGridBuffer(device);

        const vertexCoords = new Float32Array([
            -1,-1, 1,-1, 1,1,
            -1,-1, 1,1, -1,1
        ]);

        this.vertexBuffer = device.createBuffer({
            size: vertexCoords.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });

        device.queue.writeBuffer(this.vertexBuffer, 0, vertexCoords);
        this.vertexCount = vertexCoords.length / 2;

        let vertexBufferLayout: GPUVertexBufferLayout[] = [
        {
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" } as GPUVertexAttribute],
            arrayStride: 8,
            stepMode: "vertex"
        }];

        let gpuPipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [gridBufferBindGroupLayout, uniformBindGroupLayout] });
        let pipelineDescriptor: GPURenderPipelineDescriptor = {
            vertex: {
                module: this.shader,
                entryPoint: "vertexMain",
                buffers: vertexBufferLayout
            },
            fragment: {
                module: this.shader,
                entryPoint: "fragmentMain",
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat()
                }]
            },
            primitive: {
                topology: "triangle-list"
            },
            layout: gpuPipelineLayout
        };

        this.pipeline = device.createRenderPipeline(pipelineDescriptor);

        let computePipelineLayout = device.createPipelineLayout({
            bindGroupLayouts: [gridBufferBindGroupLayout] });
        let computePipelineDescriptor = {
            compute: {
               module: computeShader,
               entryPoint: "main"
            },
            layout: computePipelineLayout
        };

        this.computePipeline = device.createComputePipeline(computePipelineDescriptor);

        this.computeBindGroup = this.gridBufferBindGroup;

        this.computeWorkgroupsX = this.simWidth / 8;
        this.computeWorkgroupsY = this.simHeight / 8;
    }

    populateGridBuffer(device: GPUDevice) {
        let colorData = new Uint32Array(this.simWidth*this.simHeight);
        let counter = 0;

        for (let i = 0; i < this.simWidth * this.simHeight; i++) {
            colorData[i] = counter;
            let x = i % this.simWidth;
            let y = Math.floor(i / this.simWidth);
            if (x == 0 || y == 0 || x == this.simWidth - 1 || y == this.simHeight - 1) {
                colorData[i] = 5;
            }

            counter++;
            if (counter > 5) {
                counter = 0;
            }
        }

        device.queue.writeBuffer(this.gridBufferPing, 0, colorData);
        device.queue.writeBuffer(this.gridBufferPong, 0, colorData);
    }

    randomizeArea(device: GPUDevice) {
        let colorData = new Uint32Array(this.simWidth*this.simHeight);
        for (let i = 0; i < this.simWidth * this.simHeight; i++) {
            colorData[i] = Math.floor(Math.random() * 2) * 5;
        }

        device.queue.writeBuffer(this.gridBufferPing, 0, colorData);
        device.queue.writeBuffer(this.gridBufferPong, 0, colorData);
    }

    static async new(shaderUri: string, computeShaderUri: string): Promise<GridProgram> {
        return new GridProgram(await GPUHelper.loadShader(device, shaderUri), await GPUHelper.loadShader(device, computeShaderUri));
    }
}

class TriangleProgram implements Program {
    shader: GPUShaderModule;

    vertexBuffer: GPUBuffer;
    vertexCount: number;
    uniformBuffer: GPUBuffer;
    uniformBindGroup: GPUBindGroup;
    bindGroups: GPUBindGroup[];
    pipeline: GPURenderPipeline;

    protected constructor(shader: GPUShaderModule) {
        this.shader = shader;

        this.uniformBuffer = device.createBuffer({
            size: 3 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        let uniformFragmentLayout: GPUBindGroupLayoutEntry = {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: "uniform" }
        };
        let uniformBindGroupLayout = device.createBindGroupLayout({ entries: [uniformFragmentLayout] });

        this.uniformBindGroup = device.createBindGroup({
            layout: uniformBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.uniformBuffer, offset: 0, size: 3 * 4 }
                }
            ]
        });

        this.bindGroups = [this.uniformBindGroup];

        const vertexCoords = new Float32Array([
            -0.8, -0.6, 0.8, -0.6, 0, 0.7
        ]);

        this.vertexBuffer = device.createBuffer({
            size: vertexCoords.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
        });

        device.queue.writeBuffer(this.vertexBuffer, 0, vertexCoords);
        this.vertexCount = 3;

        let vertexBufferLayout: GPUVertexBufferLayout[] = [
        {
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" } as GPUVertexAttribute],
            arrayStride: 8,
            stepMode: "vertex"
        }];


        let gpuPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [uniformBindGroupLayout] });
        let pipelineDescriptor: GPURenderPipelineDescriptor = {
            vertex: {
                module: this.shader,
                entryPoint: "vertexMain",
                buffers: vertexBufferLayout
            },
            fragment: {
                module: this.shader,
                entryPoint: "fragmentMain",
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat()
                }]
            },
            primitive: {
                topology: "triangle-list"
            },
            layout: gpuPipelineLayout
        };

        this.pipeline = device.createRenderPipeline(pipelineDescriptor);
    }

    static async new(shaderUri: string): Promise<TriangleProgram> {
        return new TriangleProgram(await GPUHelper.loadShader(device, shaderUri));
    }
}

/* ------------------------------------------------------------------ */
//  Initialization & render loop                                       //
/* ------------------------------------------------------------------ */

let triangleProgram: TriangleProgram;
let gridProgram: GridProgram;

let device: GPUDevice;
let context: GPUCanvasContext;

async function initDeviceAndContext(canvas: HTMLCanvasElement): Promise<boolean> {
    device = await GPUHelper.getWebGPUDevice(canvas);
    if (device == null) {
        return false;
    }

    context = canvas.getContext("webgpu");
    context.configure({
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied",
    });

    return true;
}

async function initWebGPU(canvas: HTMLCanvasElement): Promise<boolean> {
    if (!await initDeviceAndContext(canvas)) {
        return false;
    }

    triangleProgram = await TriangleProgram.new("/game/gpu/triangle.wgsl");
    gridProgram = await GridProgram.new("/game/gpu/grid.wgsl", "/game/gpu/compute.wgsl");

    return true;
}


function enterFullscreen() {
    canvasDiv.requestFullscreen();
}

(window as any).enterFullscreen = enterFullscreen;
(window as any).randomize = randomize;

var randomizeArea: boolean = false;
function randomize() {
    if (GlobalMode == Mode.Grid) {
        randomizeArea = true;
    }
}

let previousTime = null;

window.addEventListener('load', async () => {
    canvasDiv = document.getElementById("canvasDiv") as HTMLDivElement;
    canvas = document.createElement("canvas") as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.id = "tracesCanvas";
    canvasDiv.appendChild(canvas);

    let cssWidth = window.getComputedStyle(canvas, null).getPropertyValue("width");
    let cssHeight = window.getComputedStyle(canvas, null).getPropertyValue("height");
    canvas.setAttribute('width', cssWidth);
    canvas.setAttribute('height', cssHeight);
    console.log(`${cssWidth}x${cssHeight}`)

    if (await initWebGPU(canvas)) {
        previousTime = performance.now();
        requestAnimationFrame(renderFrame);
    }
});

var pingPong = 0;
var delayCounter = 0;

let triangleColor: Float32Array = new Float32Array([Math.random(), 0.5, 0.8]);
let triangleColorLastChange = 0;
const TRIANGLE_COLOR_INTERVAL = 150; // ms

var delayRatio = 2;
function renderFrame() {
    delayCounter++;
    let now = performance.now();
    let timeDelta = (now - previousTime) / 1000;
    previousTime = now;

    let commandEncoder = device.createCommandEncoder();
    let passEncoder = commandEncoder.beginRenderPass(GPUHelper.createRenderPassDescriptor(context));

    var program: Program;
    if (GlobalMode == Mode.Triangle) {
        program = triangleProgram;

        let elapsed = now - triangleColorLastChange;
        if (elapsed >= TRIANGLE_COLOR_INTERVAL) {
            triangleColor = new Float32Array([Math.random(), Math.random(), Math.random()]);
            triangleColorLastChange = now;
        }
        device.queue.writeBuffer(program.uniformBuffer, 0, triangleColor);
    } else if (GlobalMode == Mode.Grid) {
        program = gridProgram;

        if (randomizeArea) {
            (gridProgram as GridProgram).randomizeArea(device);
            randomizeArea = false;
        }

        device.queue.writeBuffer(program.uniformBuffer, 0, new Float32Array([canvas.width, canvas.height]));
        device.queue.writeBuffer((program as GridProgram).pingPongBuffer, 0, new Uint32Array([pingPong, pingPong]));
        if (delayCounter % delayRatio == 0)
        {
            if (pingPong == 0) {
                pingPong = 1;
            } else {
                pingPong = 0;
            }
        }
    }

    passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
    passEncoder.setPipeline(program.pipeline);
    passEncoder.setVertexBuffer(0, program.vertexBuffer);
    for (let i = 0; i < program.bindGroups.length; i++) {
        passEncoder.setBindGroup(i, program.bindGroups[i]);
    }
    passEncoder.draw(program.vertexCount);
    passEncoder.end();

    if (GlobalMode == Mode.Grid && delayCounter % delayRatio == 0) {
        let computePassEncoder = commandEncoder.beginComputePass();
        computePassEncoder.setPipeline((program as GridProgram).computePipeline);
        computePassEncoder.setBindGroup(0, (program as GridProgram).computeBindGroup);
        computePassEncoder.dispatchWorkgroups((program as GridProgram).computeWorkgroupsX, (program as GridProgram).computeWorkgroupsY);
        computePassEncoder.end();
    }

    let commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);

    requestAnimationFrame(renderFrame);
}

window.addEventListener("resize", () => {
    let canvas = document.getElementById("tracesCanvas");
    let cssWidth = window.getComputedStyle(canvas, null).getPropertyValue("width");
    let cssHeight = window.getComputedStyle(canvas, null).getPropertyValue("height");
});
