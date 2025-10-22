import type { ProfileSondagem } from "@/types";
import {
  Colors,
  DxfWriter,
  point3d,
  TextHorizontalAlignment,
  TextVerticalAlignment,
  Units,
} from "@tarikjabiri/dxf";
import { downloadDXF } from "./dxfPalitoGenerator";

export const generateDxfProfile = async (
  data: ProfileSondagem[],
  fontSize: number,
  textDirection: "horizontal" | "vertical"
) => {
  const dxf = new DxfWriter();
  dxf.setUnits(Units.Meters);

  const layer = dxf.addLayer("0", Colors.White, "Continuous");

  const arialTextStyle = dxf.tables.addStyle("arialText");
  arialTextStyle.fontFileName = "arial.ttf";
  arialTextStyle.widthFactor = 1.0;
  arialTextStyle.fixedTextHeight = 0;

  data.forEach((sondagem) => {
    const startPoint = point3d(sondagem.distance, sondagem.z);
    const endPoint = point3d(sondagem.distance, sondagem.z - 1500);

    dxf.addLine(startPoint, endPoint, { layerName: layer.name });
    const sondagemText = dxf.addText(
      point3d(startPoint.x + 2, startPoint.y - 5),
      fontSize,
      sondagem.name,
      {
        layerName: layer.name,
        horizontalAlignment:
          textDirection === "horizontal"
            ? TextHorizontalAlignment.Left
            : TextHorizontalAlignment.Right,
        verticalAlignment: TextVerticalAlignment.Top,
        secondAlignmentPoint: point3d(startPoint.x + 2, startPoint.y - 1),
        rotation: textDirection === "horizontal" ? 0 : 90,
      }
    );
    sondagemText.textStyle = arialTextStyle.name;
  });
  // Baixando o arquivo
  const dxfString = dxf.stringify();
  downloadDXF(dxfString, "perfil.dxf");
};
