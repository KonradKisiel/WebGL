precision mediump float;

varying vec2 v_fragTextCord;
varying vec3 v_fragNormal;

uniform sampler2D u_s2D_texture;
void main()
{  
    vec3 ambientLightIntensity = vec3(0.1, 0.12, 0.12);
    vec3 moonLightIntensity = vec3(0.12, 0.18, 0.45);
    vec3 sunLightIntensity = vec3(0.77, 0.57, 0.17);
    //directional light
    vec3 sunLightDirection = normalize(vec3(-10.0, 12.0, -7.0));
    vec3 moonLightDirection = normalize(vec3(5.0, 15.0, 15.0));

    vec3 sufaceNormal = normalize(v_fragNormal);

    vec4 texel = texture2D(u_s2D_texture, v_fragTextCord);
    vec3 lightIntensity = ambientLightIntensity +
        sunLightIntensity*max(dot(step(0.3, v_fragNormal), sunLightDirection), 0.2)
        +moonLightIntensity*max(dot(step(0.3, v_fragNormal), moonLightDirection), 0.3);

    gl_FragColor = vec4(texel.rgb * lightIntensity, 1.0);
}
//there are also point lights, and spot lights