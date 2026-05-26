#version 3.7;
               

global_settings {
 
    photons {
      spacing 0.01   
    }
}
light_source {
  <0,0,0>             // light's position (translated below)
  color rgb 6.0       // light's color
  area_light
  <8, 0, 0> <0, 0, 8> // lights spread out across this distance (x * z)
  1,1
  jitter              // adds random softening of light
  translate <40, 80, -40>   // <x y z> position of light  
    photons {           // photon block for a light source
    refraction on
    reflection on
  }
}



camera {
    location  <0, 1, -1.5>
    look_at   <0, 0, 0>   
}

 
 
#macro HSV2RGBT(H, S, V)
  #local hh = H * 6;
  #local i  = mod(floor(hh), 6);
  #local f  = hh - floor(hh);
  #local p  = V * (1 - S);
  #local q  = V * (1 - S * f);
  #local tt  = V * (1 - S * (1 - f));

  #local R = 0;
  #local G = 0;
  #local B = 0;

  #if (i = 0)
    #local R = V; #local G = tt; #local B = p;
  #elseif (i = 1)
    #local R = q; #local G = V; #local B = p;
  #elseif (i = 2)
    #local R = p; #local G = V; #local B = tt;
  #elseif (i = 3)
    #local R = p; #local G = q; #local B = V;
  #elseif (i = 4)
    #local R = tt; #local G = p; #local B = V;
  #else // i = 5
    #local R = V; #local G = p; #local B = q;
  #end

  color rgbt <R, G, B, 0.6>
#end

#macro HSV2RGB(H, S, V)
  #local hh = H * 6;
  #local i  = mod(floor(hh), 6);
  #local f  = hh - floor(hh);
  #local p  = V * (1 - S);
  #local q  = V * (1 - S * f);
  #local tt  = V * (1 - S * (1 - f));

  #local R = 0;
  #local G = 0;
  #local B = 0;

  #if (i = 0)
    #local R = V; #local G = tt; #local B = p;
  #elseif (i = 1)
    #local R = q; #local G = V; #local B = p;
  #elseif (i = 2)
    #local R = p; #local G = V; #local B = tt;
  #elseif (i = 3)
    #local R = p; #local G = q; #local B = V;
  #elseif (i = 4)
    #local R = tt; #local G = p; #local B = V;
  #else // i = 5
    #local R = V; #local G = p; #local B = q;
  #end

  <R, G, B>
#end
    
#declare Radius     = 0.15;

#declare Random_1 = seed (52053); // Use: "rand(Random_1)" 
#declare Random_2 = seed ( 1953); // Use: "rand(Random_2)"
#declare Random_3 = seed (  153); // Use: "rand(Random_3)"

      #declare counter = 1;
union{
 // outer loop
 #local NrX = -2;    // start x
 #local EndNrX = 2; // end   x
 #while (NrX< EndNrX) 
    // more inner loop
    #local NrY = -2;    // start y 
    #local EndNrY = 2; // end   y
    #while (NrY< EndNrY) 
       // innerst loop
       #local NrZ = -2;    // start z
       #local EndNrZ = 2; // end   z
       #while (NrZ< EndNrZ) 
       #declare counter = counter + 0.1;
            sphere {
                <0, 0, 0>, Radius
        
                 material{ 
                    
                  texture {
                    pigment {HSV2RGBT(17*counter, 1, 1)}
                    finish {
                      ambient 0.0
                      diffuse 0.05
                      specular 0.6
                      roughness 0.005
                      reflection {
                        0.01, 1.0
                        fresnel on
                      }
                      conserve_energy
                    }
                  }
                  interior {
                    ior 1.5
                    fade_power 1001
                    fade_distance 0.9
                    fade_color HSV2RGB(17*counter, 1, 1)
                  }    
                  }
              translate<  NrX*0.5 + 0.35*(-0.5+rand(Random_1)) , 
                          NrY*0.5 + 0.35*(-0.5+rand(Random_2)) , 
                          NrZ*0.5 + 0.35*(-0.5+rand(Random_3))  > 
                          
    rotate<0,360*(clock+0.00),0> 
        
            }                      

       #local NrZ = NrZ + 1;  // next Nr z
       #end // --------------- end of loop z
       // end innerst loop
    #local NrY = NrY + 1;  // next Nr y
    #end // --------------- end of loop y
    // end more inner loop
 #local NrX = NrX + 1;  // next Nr x
 #end // --------------- end of loop x
 // end of outer loop
rotate<0,-30,0> 
translate<0,0.2,-0.5>} // end of union
