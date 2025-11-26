import ezdxf
from io import StringIO

# ============= FUNÇÕES AUXILIARES =============

def create_layer(doc, layer_name, color):
    """
    Cria uma layer com cor específica
    
    Args:
        doc: documento DXF
        layer_name: nome da layer
        color: cor ACI (2=amarelo, 5=azul, 6=magenta, 3=verde)
    
    Returns:
        layer object
    """
    return doc.layers.add(name=layer_name, color=color)


def add_target(msp, x, y, layer_name):
    """
    Adiciona um alvo (círculo + cruz + hatches) numa layer específica
    
    Args:
        msp: modelspace do documento
        x: coordenada X do centro
        y: coordenada Y do centro
        layer_name: nome da layer onde adicionar
    """
    attribs = {'layer': layer_name}
    
    # Círculo raio 4
    msp.add_circle((x, y), radius=4, dxfattribs=attribs)
    
    # Linha horizontal: de (x-5, y) até (x+5, y)
    msp.add_line((x - 5, y), (x + 5, y), dxfattribs=attribs)
    
    # Linha vertical: de (x, y-5) até (x, y+5)
    msp.add_line((x, y - 5), (x, y + 5), dxfattribs=attribs)
    
    # Hatch com dois boundaries (quartos superior esquerdo e inferior direito)
    hatch = msp.add_hatch(dxfattribs={
        'layer': layer_name,
        'color': 256  # 256 = BYLAYER no AutoCAD
        })
    
    # Boundary 1: Quarto superior esquerdo (90° a 180°)
    edge_path_1 = hatch.paths.add_edge_path()
    edge_path_1.add_arc(
        center=(x, y),
        radius=4,
        start_angle=90,
        end_angle=180,
        ccw=True
    )
    edge_path_1.add_line((x - 4, y), (x, y))
    edge_path_1.add_line((x, y), (x, y + 4))
    
    # Boundary 2: Quarto inferior direito (270° a 360°)
    edge_path_2 = hatch.paths.add_edge_path()
    edge_path_2.add_arc(
        center=(x, y),
        radius=4,
        start_angle=270,
        end_angle=360,
        ccw=True
    )
    edge_path_2.add_line((x + 4, y), (x, y))
    edge_path_2.add_line((x, y), (x, y - 4))
    
    hatch.set_solid_fill(color=256)


# ============= FUNÇÃO DE TESTE =============

def generate_target_test_dxf():
    """
    Gera DXF de teste com 4 alvos, cada um numa layer de cor diferente
    
    Returns:
        string do DXF
    """
    doc = ezdxf.new()
    msp = doc.modelspace()
    
    # Criar 4 layers com cores diferentes
    create_layer(doc, "SONDAGENS_AMARELO", color=2)   # Amarelo
    create_layer(doc, "SONDAGENS_AZUL", color=5)      # Azul
    create_layer(doc, "SONDAGENS_MAGENTA", color=6)   # Magenta
    create_layer(doc, "SONDAGENS_VERDE", color=3)     # Verde
    
    # Adicionar alvos em posições diferentes, cada um na sua layer
    add_target(msp, x=0, y=0, layer_name="SONDAGENS_AMARELO")
    add_target(msp, x=20, y=0, layer_name="SONDAGENS_AZUL")
    add_target(msp, x=0, y=20, layer_name="SONDAGENS_MAGENTA")
    add_target(msp, x=20, y=20, layer_name="SONDAGENS_VERDE")
    
    stream = StringIO()
    doc.write(stream)
    return stream.getvalue()


# ============= FUNÇÕES ANTIGAS (manter para compatibilidade) =============

def generate_line_dxf():
    """Gera DXF com uma linha simples de (0,0) até (10,10)"""
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_line((0, 0), (10, 10))
    
    stream = StringIO()
    doc.write(stream)
    return stream.getvalue()


def generate_circle_dxf(center_x=0, center_y=0, radius=5):
    """Gera DXF com um círculo"""
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_circle((center_x, center_y), radius)
    
    stream = StringIO()
    doc.write(stream)
    return stream.getvalue()


def generate_text_dxf(text="Hello DXF", x=0, y=0, height=1):
    """Gera DXF com um texto"""
    doc = ezdxf.new()
    msp = doc.modelspace()
    msp.add_text(text, dxfattribs={'height': height}).set_placement((x, y))
    
    stream = StringIO()
    doc.write(stream)
    return stream.getvalue()