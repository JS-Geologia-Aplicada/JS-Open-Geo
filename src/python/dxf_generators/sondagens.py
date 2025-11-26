from typing import Dict, List, Optional, Set
import ezdxf
import ezdxf.filemanagement
from ezdxf.document import Drawing
from ezdxf.layouts.blocklayout import BlockLayout
from ezdxf.layouts.layout import Modelspace 
from  ezdxf.entities.mleader import MLeaderStyle
from io import StringIO
from ezdxf.math import Vec2
from ezdxf.render.mleader import HorizontalConnection, VerticalConnection, ConnectionSide

# Cores ACI disponíveis para usar
AVAILABLE_COLORS = [2, 3, 4, 5, 6]

def setup_mleaderstyle(doc: Drawing) -> None:
    """Configura estilo personalizado para multileaders"""
    
    if "Sondagens" not in doc.mleader_styles:
        style: 'MLeaderStyle' = doc.mleader_styles.duplicate_entry("Standard", "Sondagens")
        style.dxf.text_attachment_direction = 0        
        style.dxf.arrow_head_type = 0
        style.dxf.has_dogleg = 0
        style.dxf.has_landing = 1
        style.dxf.landing_gap_size = 1.0

    if "Arial" not in doc.styles:
        arial_style = doc.styles.add("Arial", font="arial.tff")

        

def count_color_usage(layers_data: List[Dict]) -> Dict[int, int]:
    """
    Conta quantas vezes cada cor está sendo usada
    
    Args:
        layers_data: lista com formato [{layer: str, color: int, sondagens: [...]}, ...]
    
    Returns:
        dicionário {cor: quantidade}
    """
    color_count: Dict[int, int] = {}

    for layer_info in layers_data:
        color = layer_info.get('color')

        if color is not None:
            if color in color_count:
                color_count[color] += 1
            else:
                color_count[color] = 1
    
    return color_count


def get_available_colors(used_colors: Set[int]) -> List[int]:
    """
    Seleciona a cor menos utilizada
    Prioridade: cores não usadas (uso=0) > cores menos usadas
    Em caso de empate, escolhe a de menor ACI
    
    Args:
        used_colors: lista de cores já em uso, ex: [2, 5]
    
    Returns:
        lista de cores disponíveis, ex: [3, 4, 6]
    """
    available = [color for color in AVAILABLE_COLORS if color not in used_colors]
    return available

def select_least_used_color(color_usage: Dict[int, int]) -> int:
    """
    Seleciona a cor menos utilizada
    Em caso de empate, escolhe a de menor ACI (número menor)
    
    Args:
        color_usage: dicionário {cor: quantidade}, ex: {2: 3, 5: 1, 6: 2}
    
    Returns:
        cor selecionada (int)
    """
    used_colors = set(color_usage.keys())
    available = get_available_colors(used_colors)
    
    if available:
        return min(available)
    
    min_usage = min(color_usage.values())

    least_used_colors = [
        color for color, count in color_usage.items() if count == min_usage
    ]

    return min(least_used_colors)

def assign_colors_to_layers(layers_data: List[Dict]) -> None:
    """
    Processa todas as layers e atribui cores às que não têm
    
    Args:
        layers_data: lista com formato [{layer: str, color?: int, sondagens: [...]}, ...]

    Returns:
        None (modifica layers_data diretamente)
    """
    for layer_info in layers_data:
        if 'color' in layer_info and layer_info['color'] is not None:
            continue
        color_usage = count_color_usage(layers_data)
        selected_color = select_least_used_color(color_usage)
        layer_info['color'] = selected_color

def create_borehole_block(doc: Drawing):
        """
    Cria a definição do bloco "SONDAGEM" (alvo de sondagem)
    Só precisa ser chamado UMA vez por documento
    
    Args:
        doc: objeto DXF document (ezdxf)
    
    Returns:
        block: referência ao block criado
    """
        block: BlockLayout = doc.blocks.new(name="SONDAGEM")
        block.add_circle(
            center=(0,0),
            radius=4,
            dxfattribs={'layer': '0'}
        )
        block.add_line(
            start=(-5,0),
            end=(5,0),
            dxfattribs={'layer': '0'}
        )
        block.add_line(
            start=(0,-5),
            end=(0,5),
            dxfattribs={'layer': '0'}
        )


        hatch = block.add_hatch(dxfattribs={
        'layer': '0',
        'color': 256  # 256 = BYLAYER
        })
    
        # Boundary 1: Quarto superior esquerdo (90° a 180°)
        edge_path_1 = hatch.paths.add_edge_path()
        edge_path_1.add_arc(
            center=(0,0),
            radius=4,
            start_angle=90,
            end_angle=180,
            ccw=True
        )
        edge_path_1.add_line((-4, 0), (0,0))
        edge_path_1.add_line((0,0), (0, 4))
    
        # Boundary 2: Quarto inferior direito (270° a 360°)
        edge_path_2 = hatch.paths.add_edge_path()
        edge_path_2.add_arc(
            center=(0,0),
            radius=4,
            start_angle=270,
            end_angle=360,
            ccw=True
        )
        edge_path_2.add_line((4,0), (0,0))
        edge_path_2.add_line((0,0), (0,-4))
    
        hatch.set_solid_fill(color=256)

def insert_borehole_block(msp: 'Modelspace', x: float, y: float, layer_name: str) -> None:
    """
    Insere o block "SONDAGEM" em uma posição específica
    
    Args:
        msp: model space do documento (onde inserir)
        x: coordenada X
        y: coordenada Y
        layer_name: nome da layer (define a cor automaticamente via BYLAYER)
    
    Returns:
        None
    """
    msp.add_blockref(
        'SONDAGEM',
        insert=(x, y),
        dxfattribs={
            'layer': layer_name
        }
    )
    
def add_borehole_label(
    msp: Modelspace,
    doc: Drawing,
    x: float,
    y: float,
    text: str,
    layer_name: str,
    angle: float = 30.0,
    segment_length: float = 10.0,
    style_name: str = "Standard"
) -> None:
    """
    Adiciona identificação usando MULTILEADER nativo do DXF
    
    Args:
        msp: model space do documento
        doc: documento DXF (necessário para verificar/criar estilos)
        x: coordenada X do centro do alvo
        y: coordenada Y do centro do alvo
        text: texto a exibir (ex: "SP-01")
        layer_name: nome da layer
        angle: ângulo em graus para posicionar o texto (default: 45° = diagonal superior direita)
        segment_length: comprimento do segmento da linha (default: 10.0)
        style_name: nome do MLEADERSTYLE a usar (default: "Standard")
    
    Returns:
        None
    """

    
    # Target point (centro do alvo da sondagem)
    target = Vec2(x, y)
    
    # Criar multileader builder
    ml_builder = msp.add_multileader_mtext(style=style_name, dxfattribs={'layer': layer_name})
    ml_builder.set_content(text, style="Arial")
    ml_builder.set_arrow_properties(name="None")
    ml_builder.set_connection_types(left=HorizontalConnection.by_style, right=HorizontalConnection.by_style, top=VerticalConnection.by_style, bottom=VerticalConnection.by_style)
    ml_builder.add_leader_line(side=ConnectionSide.left, vertices=[target])

    # Usar quick_leader para geometria automática
    ml_builder.quick_leader(
        text,
        target=target,
        segment1=Vec2.from_deg_angle(angle, segment_length),
        connection_type=HorizontalConnection.bottom_of_bottom_line_underline
    )



def add_borehole_complete(
    msp: Modelspace,
    doc: Drawing,
    x: float,
    y: float,
    hole_id: str,
    layer_name: str,
    label_angle: float = 45.0,
    label_segment_length: float = 10.0,
    style_name: str = "Sondagens"
) -> None:
    """
    Adiciona uma sondagem completa (alvo + identificação)
    
    Args:
        msp: model space do documento
        doc: documento DXF
        x: coordenada X
        y: coordenada Y
        hole_id: identificação da sondagem (ex: "SP-01")
        layer_name: nome da layer
        label_angle: ângulo do multileader (default: 45°)
        label_segment_length: comprimento do segmento (default: 10.0)
        style_name: estilo do multileader (default: "Standard")
    """
    # Inserir o alvo (block)
    insert_borehole_block(msp, x, y, layer_name)
    
    # Adicionar identificação (multileader)
    add_borehole_label(
        msp, doc, x, y, hole_id, layer_name,
        angle=label_angle,
        segment_length=label_segment_length,
        style_name=style_name
    )


def generate_boreholes_dxf(
    grouped_data: List[Dict],
) -> str:
    """
    Gera DXF a partir de dados agrupados por layer
    
    Args:
        grouped_data: Lista de grupos, cada um com estrutura:
            {
                'layer': str,              # Nome da layer
                'color': int (opcional),   # Cor ACI (2-6), se None usa automático
                'boreholes': [
                    {'id': str, 'x': float, 'y': float},
                    ...
                ]
            }
    
    Returns:
        Drawing: Documento dxf em formato de string
    """    
    # 1. Criar documento
    doc: Drawing = ezdxf.filemanagement.new()
    msp: Modelspace = doc.modelspace()

    setup_mleaderstyle(doc)
    
    # 2. Preparar dados das layers para atribuição automática de cores
    layers_data: List[Dict] = []
    for group in grouped_data:
        layer_name = group['layer']
        specified_color = group.get('color', None)
        
        layers_data.append({
            'name': layer_name,
            'color': specified_color  # None se não especificado
        })
    
    # 3. Atribuir cores automáticas apenas para layers sem cor especificada
    assign_colors_to_layers(layers_data)
    
    # 4. Criar as layers no documento
    for layer_info in layers_data:
        doc.layers.add(
            name=layer_info['name'],
            color=layer_info['color']
        )
    
    # 5. Criar o block do alvo UMA VEZ
    create_borehole_block(doc)
    
    # 6. Processar cada grupo de sondagens
    for group_idx, group in enumerate(grouped_data):
        layer_name = group['layer']
        boreholes = group['boreholes']
        
        # Inserir cada sondagem deste grupo
        for borehole in boreholes:
            hole_id = borehole['id']
            x = borehole['x']
            y = borehole['y']
            
            # Parâmetros opcionais (podem vir do JS futuramente)
            label_angle = borehole.get('label_angle', 45.0)
            label_length = borehole.get('label_segment_length', 10.0)
            
            # Adicionar sondagem completa
            add_borehole_complete(
                msp, doc, x, y, hole_id, layer_name,
                label_angle=label_angle,
                label_segment_length=label_length
            )
    
    # 7. Retornar arquivo como string
    stream = StringIO()
    doc.write(stream)
    return stream.getvalue()