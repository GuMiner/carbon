---
title: "Flux Sim"
date: "2014-08-01"
updated: "May 2024"
image: "/projects/simulation-projects/FluxSim.png"
link: ""
tags: ["Simulation", "Software"]
---

## About

**Flux Sim** is a thermal simulation program I wrote to test the [Eigen](http://eigen.tuxfamily.org/index.php?title=Main_Page) matrix math library and the [SFML](http://www.sfml-dev.org/) graphics library.

The thermal dynamics are performed by iteratively solving a large spare matrix linking each neighboring cell (image pixel) to each other cell and equalizing the temperatures, simulating heat flow.

The physics and mathematical infrastructure for this program were derived from [Nuclear Heat Transport](https://books.google.com/books/about/Nuclear_heat_transport.html?id=97UjAAAAMAAJ) by *M. M. El-Wakil*.

![Partially-equalized random thermal distribution](/projects/simulation-projects/flux-sim/FluxSim1.png "Partially-equalized random thermal distribution")

## Capabilities

![Substantially-equalized random thermal distribution](/projects/simulation-projects/flux-sim/FluxSim2.png "Substantially-equalized random thermal distribution")

![Heat flow from a cold aluminum rectangle to hot walls](/projects/simulation-projects/flux-sim/FluxSim3.png "Heat flow from a cold aluminum rectangle to hot walls")

This application accurately simulates the thermal transport over time within a piece of aluminum, although other materials can be added with material files which specify the material heat capacity at different temperatures.

Because this application simply simulates a massive 2D grid as a matrix, it was easy to add support for insulated points and fixed-temperature points.

Simulating additional geometry, while certainly possible, has not been experimented with.

![Fixed-temperature points, evenly distributed throughout the simulation grid](/projects/simulation-projects/flux-sim/FluxSim4.png "Fixed-temperature points, evenly distributed throughout the simulation grid")

## Software

This program is written in platform-independent C++ code, but you'll have to source the libraries yourself and I have not tested Unix/OS X compilation.

The Windows executable can be downloaded [here](/projects/simulation-projects/flux-sim/FluxSim_WinExecutable.zip) -- you'll also need the Visual Studio 2012 (32-bit) [C++ redistributable](https://www.microsoft.com/en-us/download/details.aspx?id=30679).

The source code and assets can be downloaded [here](/projects/simulation-projects/flux-sim/FluxSim_SourcesAssets.zip).

<video controls>
  <source src="/projects/simulation-projects/flux-sim/demo.mp4" type="video/mp4">
  Your browser does not support the video tag. Unfortunately, the video will not play here.
</video>

*FluxSim in action, simulating heat flow.*
