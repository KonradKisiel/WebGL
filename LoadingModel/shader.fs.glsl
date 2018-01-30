precision mediump float;
varying vec2 v_fragTextCord;
uniform sampler2D u_s2D_texture;
void main()
{  
    gl_FragColor = texture2D(u_s2D_texture, v_fragTextCord);
}