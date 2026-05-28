---
title: "CodeGell"
date: "2014-06-01"
updated: "June 2024"
image: "/projects/software-projects/CodeGell.png"
link: ""
tags: ["Games", "Software"]
---

## About

**CodeGell** project tested if real-time CSG generation with volumetric texture map creation was feasible for use within a computer game.

Overall, while performance was acceptable rendering one object, the resulting application was not scalable for use within a production computer game

![A volumetrically-rendered checkerboard](/projects/software-projects/code-gell/checkerboard volumetric texture shaded.png "Checkerboard")
![CSG from Netgen, without volumetric textures](/projects/software-projects/code-gell/Triangle ID texture shaded.png "Triangle IDs")

**CodeGell** uses a [modified version](https://github.com/GuMiner/Surface-Netgen-Fork) of the [Netgen library](http://sourceforge.net/projects/netgen-mesher/), which I had stripped-down to only generate triangles, surface meshes, and overall improve performance and usability for realtime operations.

When given a description of an object, this program will send it through my Netgen variant to determine the triangles forming the object's mesh, put the triangles on a texture image, and fill the texture using an appropriate volumetric voxel texture. With this process, **CodeGell** renders in real-time object *cuts* and *holes* instead of the defined triangles of an *object itself*.

## Implementation

This program uses modern OpenGL 4.0 rendering, along with [GLEW](http://glew.sourceforge.net/), [Surface-Netgen-Fork](https://github.com/GuMiner/Surface-Netgen-Fork), and [GLFW3](http://www.glfw.org/index.html).

For more information, see the source code on [GitHub](https://github.com/GuMiner/Volumetric-CSG-Texture-Mapping).

![Watermellon volumetric texture shaded object](/projects/software-projects/code-gell/Watermelon volumetric texture shaded.png "Watermelon Texture")
![Volumetric fragment-shared object](/projects/software-projects/code-gell/High-Res fragment shaded.png "Fragment Shaded")
