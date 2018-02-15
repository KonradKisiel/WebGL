precision mediump float;

varying vec2 v_fragTextCord;
varying vec3 v_fragNormal;

uniform sampler2D u_s2D_texture;
void main()
{  
    vec3 ambientLightIntensity = vec3(0.05, 0.05, 0.05);
    vec3 sunLightIntensity = vec3(0.7, 0.65, 0.6);

    vec3 sunLightDirection = normalize(vec3(5.0, 12.0, -1.0));
    vec3 sufaceNormal = normalize(v_fragNormal);

    vec4 texel = texture2D(u_s2D_texture, v_fragTextCord);
    vec3 lightIntensity = ambientLightIntensity+
        sunLightIntensity*max(dot(v_fragNormal, sunLightDirection), 0.0);

    gl_FragColor = vec4(texel.rgb * lightIntensity, 1.0);
}
//there are also point lights, and spot lights