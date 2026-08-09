import bpy, math

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 800

def hex2rgb(h):
    h = h.lstrip('#')
    def lin(c):
        c = c/255
        return c/12.92 if c <= 0.04045*12.92 else ((c+0.055)/1.055)**2.4
    return tuple(lin(int(h[i:i+2],16)) for i in (0,2,4))

def mat(name, hexc, rough=0.45, sss=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*hex2rgb(hexc), 1)
    b.inputs['Roughness'].default_value = rough
    try:
        b.inputs['Subsurface Weight'].default_value = sss
    except KeyError: pass
    return m

M_BODY  = mat('body','EF8A38',0.42,0.08)
M_EARIN = mat('earin','F5A56B',0.5)
M_FACE  = mat('face','54371C',0.5)
M_CUSH  = mat('cushion','EBD6B4',0.6)
M_BLUSH = mat('blush','F7A877',0.55)
M_HEART = mat('heart','EF5F5F',0.4)

def smooth(o, sub=2):
    if sub:
        md = o.modifiers.new('s','SUBSURF'); md.levels = sub; md.render_levels = sub
    for p in o.data.polygons: p.use_smooth = True

# 몸통 타원체 반지름: a(x)=1.59, b(y)=1.35, c(z)=1.24, 중심 z=1.05
A,B,C,CZ = 1.59,1.35,1.24,1.05
def surf_y(x,z,out=0.02):
    t = 1-(x/A)**2-((z-CZ)/C)**2
    return -(B*math.sqrt(max(t,0.02))+out)

# 쿠션
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.95, location=(0,0,-0.18))
c = bpy.context.object; c.scale=(1.28,1.0,0.22); c.data.materials.append(M_CUSH); smooth(c)

# 몸통
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.35, location=(0,0,CZ))
body = bpy.context.object; body.scale=(1.18,1.0,0.92)
body.data.materials.append(M_BODY); smooth(body)

# 귀
for sx in (-1,1):
    bpy.ops.mesh.primitive_cone_add(radius1=0.4, radius2=0.05, depth=0.7,
        location=(sx*0.85, 0.0, 2.16), rotation=(0, sx*0.35, 0))
    e = bpy.context.object; e.data.materials.append(M_BODY); smooth(e)
    bpy.ops.mesh.primitive_cone_add(radius1=0.2, radius2=0.03, depth=0.4,
        location=(sx*0.82, -0.14, 2.10), rotation=(math.radians(-10), sx*0.35, 0))
    ei = bpy.context.object; ei.data.materials.append(M_EARIN); smooth(ei)

# ∪ 눈, 미소 — 베지어 아크(정면), 표면 y에 배치
def arc(x, z, w, d, bevel, up=False):
    cu = bpy.data.curves.new('arc','CURVE'); cu.dimensions='3D'
    cu.bevel_depth = bevel; cu.bevel_resolution = 6; cu.use_fill_caps = True
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(2)
    sgn = 1 if up else -1
    pts = [(-w,0,0),(0,0,sgn*-d),(w,0,0)]
    for i,(px,_,pz) in enumerate(pts):
        bp = sp.bezier_points[i]; bp.co=(px,0,pz)
        bp.handle_left_type=bp.handle_right_type='AUTO'
    ob = bpy.data.objects.new('arc',cu)
    ob.location = (x, surf_y(x,z), z)
    ob.rotation_euler = (math.radians(8),0,0)
    ob.data.materials.append(M_FACE)
    bpy.context.collection.objects.link(ob)

arc(-0.55, 1.42, 0.17, 0.13, 0.036)   # 왼눈 ∪
arc( 0.55, 1.42, 0.17, 0.13, 0.036)   # 오른눈 ∪
arc( 0.0 , 1.02, 0.13, 0.10, 0.032)   # 미소 ∪

# 볼터치
for sx in (-1,1):
    x=sx*0.92; z=1.06
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, location=(x, surf_y(x,z,-0.02), z))
    bl = bpy.context.object; bl.scale=(1.25,0.45,0.75)
    bl.data.materials.append(M_BLUSH); smooth(bl)

# 수염 (뺨에서 바깥으로)
for sx in (-1,1):
    for dz,rot in ((0.16,8),(0.02,-4)):
        x=sx*1.30; z=1.05+dz
        bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.6,
            location=(x+sx*0.28, surf_y(x,z)+0.15, z),
            rotation=(0, math.radians(90), math.radians(sx*rot)))
        w = bpy.context.object; w.data.materials.append(M_FACE)
        for p in w.data.polygons: p.use_smooth=True

# 하트 2개
def heart(loc,s):
    for sx in (-1,1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15*s, location=(loc[0]+sx*0.11*s, loc[1], loc[2]+0.07*s))
        h=bpy.context.object; h.data.materials.append(M_HEART); smooth(h)
    bpy.ops.mesh.primitive_cone_add(radius1=0.23*s, radius2=0.01, depth=0.36*s,
        location=(loc[0], loc[1], loc[2]-0.12*s), rotation=(math.pi,0,0))
    co=bpy.context.object; co.data.materials.append(M_HEART); smooth(co)
heart((1.62,-0.7,2.35),0.9)
heart((2.05,-0.4,1.75),0.55)

# 라이팅 / 월드
bpy.ops.object.light_add(type='AREA', location=(-2.5,-3.5,4.5))
k=bpy.context.object; k.data.energy=600; k.data.size=5
k.rotation_euler=(math.radians(45),math.radians(-20),math.radians(-25))
bpy.ops.object.light_add(type='AREA', location=(3.5,-2.5,2.5))
f=bpy.context.object; f.data.energy=200; f.data.size=5
f.rotation_euler=(math.radians(60),math.radians(25),math.radians(30))
w=bpy.data.worlds.new('w'); scene.world=w; w.use_nodes=True
w.node_tree.nodes['Background'].inputs['Strength'].default_value=0.4
w.node_tree.nodes['Background'].inputs['Color'].default_value=(1,0.95,0.9,1)

# 카메라 (하트까지 들어오게 여유)
bpy.ops.object.camera_add(location=(0.3,-8.8,1.9), rotation=(math.radians(82),0,math.radians(2)))
cam=bpy.context.object; cam.data.lens=52; scene.camera=cam

scene.render.filepath='/tmp/cat3d2.png'
bpy.ops.render.render(write_still=True)
print('DONE')
