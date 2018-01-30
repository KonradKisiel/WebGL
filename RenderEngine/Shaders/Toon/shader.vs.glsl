precision mediump float;
attribute vec3 a_position;
attribute vec2 a_textCord;
attribute vec3 a_vertNormal;

varying vec2 v_fragTextCord;
varying vec3 v_fragNormal;

uniform mat4 u_mWorld;
uniform mat4 u_mView;
uniform mat4 u_mProj;
void main()
{
    v_fragTextCord = a_textCord;
    //normals related to world psn
    v_fragNormal = (u_mWorld * vec4(a_vertNormal, 0.0)).xyz;
    //1.0 makes translation possible
    gl_Position = u_mProj * u_mView * u_mWorld * vec4(a_position, 1.0);
}