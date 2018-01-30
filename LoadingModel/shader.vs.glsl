precision mediump float;
attribute vec3 a_position;
attribute vec2 a_textCord;
varying vec2 v_fragTextCord;
uniform mat4 u_mWorld;
uniform mat4 u_mView;
uniform mat4 u_mProj;
void main()
{
    v_fragTextCord = a_textCord;
    gl_Position = u_mProj * u_mView * u_mWorld * vec4(a_position, 1.0);
}