precision mediump float;

varying vec2 v_fragTextCord;
varying vec3 v_fragNormal;

uniform sampler2D u_s2D_texture;
void main()
{  
    vec3 ambientLightIntensity = vec3(0.25, 0.2, 0.4);
    vec3 sunLightIntensity = vec3(0.7, 0.6, 0.3);
    //directional light
    vec3 sunLightDirection = normalize(vec3(1.0, -4.0, -10.0));
    vec3 sufaceNormal = normalize(v_fragNormal);

    vec4 texel = texture2D(u_s2D_texture, v_fragTextCord);
    vec3 lightIntensity = ambientLightIntensity+
        sunLightIntensity*max(dot(v_fragNormal, sunLightDirection), 0.0);

    gl_FragColor = vec4(texel.rgb * lightIntensity, 1.0);
}
//there are also point lights, and spot lights