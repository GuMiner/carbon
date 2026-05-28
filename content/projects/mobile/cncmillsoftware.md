---
title: "Pro CNC 3020 Software"
date: "2015-05-01"
updated: "June 2024"
image: "/projects/mobile-projects/CncMillSoftware.png"
link: ""
tags: ["LaserMill", "Software", "Mobile"]
---

## About

After attempting to build CNC milling hardware, I decided to instead purchase a 3020-aluminum based CNC engraver. This relatively-inexpensive device was sufficiently sturdy to repurpose as a low-end mill, for soft materials.

![Pro CNC 3020 4-axis mill](/projects/mobile-projects/cnc-mill-software/Mill.jpg "CNC Mill")

## Precision

I found the hardware overall to be fairly sturdy, with stepper motors driving lead screws to move the x, y, and z axis. Each stepper motor micro-step moves each axis 0.00254 mm (2.54 µm) -- which probably means this device was designed around Imperial standards, because that nicely translates to 0.1 mils (1000 mils = 1 inch) per micro-step. By default, each stepper motor runs at 16x micro stepping, with 1600 steps per axis revolution.

In practice, this device isn't nearly that accurate, but it's nice to see the limitation is not in the control hardware.

## Software

The software that came with the device required both Windows XP and a Parallel port. Having neither, I decided to write my own using the microcontrollers I had on hand.

![Parallel port was misspelled as parakkel port too.](/projects/mobile-projects/cnc-mill-software/MillMisspelling.jpg "Misspelling")

With those microcontrollers, I wrote the following:

**Version 1:** This initial software verified that I could drive the mill, at a pitifully slow speed.
![Netduino (C#)](/projects/mobile-projects/cnc-mill-software/V1Results.jpg "V1 Results")

**Version 2:** This software worked excellently -- until the Raspberry PI had software interrupts which caused stuttering.
![Raspberry PI (C)](/projects/mobile-projects/cnc-mill-software/V2Results.jpg "V2 Results")

**Version 3:** I tried writing code for the [Parallax Propeller](https://www.parallax.com/propeller/), which was even *slower* than the Netduino -- too slow to be usable.

**Version 4:** I stopped trying to reinvent the wheel and bought an Arduino Nano and installed [GRBL](https://github.com/grbl/grbl/wiki) on it.

Unfortunately, the Arduino Nano is significantly more sensitive to voltage transients when running the mill spindle. I have to run the mill at a slow feedrate and spindle rate to avoid resetting the device due to electrical noise. However, I was able to run at a reasonable rate, unlike the Netduinio, Parallax Propeller, or Raspberry PI.

![Arduino Nano (GRBL)](/projects/mobile-projects/cnc-mill-software/V4Results.jpg "V4 Results")

## Epilogue

Due to the difficulties in using the device (and difficulty in transporting it), I sold it a few years later, focusing my attention elsewhere.
