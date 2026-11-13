"""Genera modello/LegacyGroup_foglio.xlsx: il foglio da importare in Google Sheets."""
from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.worksheet.datavalidation import DataValidation

TEAMS = {
    "Su Componidori": ["1BS","2AS","2E","3CB","3F","4BB","5BS"],
    "Mamuthones": ["1AS","1C","2D","3E","4CB","4CS","5AS"],
    "Eleonora d'Arborea": ["1A","1D","2F","3CS","4F","5A","5BB"],
    "Giganti di Monteprama": ["1CS","1F","2CB","3BB","3G","4A","4AS","5E"],
    "Shardana": ["1BB","2A","2BS","3BS","3D","4E","5DB"],
    "Mariano IV": ["1E","2BB","3A","3AS","4BS","5G","5H"],
}
HEAD = Font(bold=True, color="FFFFFF")
FILL = PatternFill("solid", fgColor="0A1B33")
ROWS = 1000

def header(ws, cols, notes, widths):
    ws.append(cols)
    for i, c in enumerate(ws[1]):
        c.font, c.fill = HEAD, FILL
        c.alignment = Alignment(vertical="center")
        c.comment = Comment(notes[i], "Legacy Group")
        ws.column_dimensions[c.column_letter].width = widths[i]
    ws.freeze_panes = "A2"

wb = Workbook()
att = wb.active; att.title = "Attivita"
header(att, ["id","data","titolo","tipo","descrizione","stato","data_fine"], [
  "Codice unico e breve dell'attività (es. a1, a2, calcetto1). Non cambiarlo dopo averlo usato nel foglio Punti.",
  "Giorno dell'attività. Scrivi 12/12/2026.",
  "Nome dell'attività come comparirà sul sito.",
  "Tipologia (es. Sport, Cultura, Volontariato). Facoltativo.",
  "Breve descrizione. Facoltativa. MAI nomi di studenti.",
  "Lascia vuoto o 'auto': lo stato (programmata / in corso / conclusa) è calcolato dalle date. Scrivi 'annullata' per annullarla.",
  "Solo per attività su più giorni: ultimo giorno (es. 13/12/2026). Altrimenti vuoto.",
], [10, 13, 32, 16, 44, 12, 13])
pt = wb.create_sheet("Punti")
header(pt, ["id_attivita","classe","punti","tipo"], [
  "L'id dell'attività (colonna id del foglio Attivita). Scegli dal menu.",
  "Sigla della classe. Scegli dal menu.",
  "Numero intero (es. 10). Un numero negativo è una penalità.",
  "collettiva = a tutta la classe; individuale = a uno studente (il nome NON va scritto).",
], [14, 10, 8, 14])
cl = wb.create_sheet("Classi")
header(cl, ["classe","squadra"], ["Sigla della classe (es. 3A).", "Squadra: scegli dal menu."], [10, 26])
for team, classes in TEAMS.items():
    for c in classes:
        cl.append([c, team])

# formati e menu a tendina
for col in ("B", "G"):
    for r in range(2, ROWS + 1):
        att[f"{col}{r}"].number_format = "dd/mm/yyyy"
dv_date = DataValidation(type="date", operator="greaterThan", formula1="DATE(2026,1,1)", allow_blank=True,
                         showErrorMessage=True, errorTitle="Data", error="Inserisci una data, es. 12/12/2026")
att.add_data_validation(dv_date); dv_date.add(f"B2:B{ROWS}"); dv_date.add(f"G2:G{ROWS}")
dv_st = DataValidation(type="list", formula1='"auto,annullata"', allow_blank=True, showErrorMessage=True)
att.add_data_validation(dv_st); dv_st.add(f"F2:F{ROWS}")

dv_id = DataValidation(type="list", formula1=f"=Attivita!$A$2:$A${ROWS}", allow_blank=False, showErrorMessage=True,
                       errorTitle="Attività", error="Scegli un id presente nel foglio Attivita")
dv_cls = DataValidation(type="list", formula1="=Classi!$A$2:$A$100", allow_blank=False, showErrorMessage=True,
                        errorTitle="Classe", error="Scegli una classe dal menu (foglio Classi)")
dv_pts = DataValidation(type="whole", operator="between", formula1="-100", formula2="100", showErrorMessage=True,
                        errorTitle="Punti", error="Serve un numero intero (es. 10)")
dv_kind = DataValidation(type="list", formula1='"collettiva,individuale"', allow_blank=False, showErrorMessage=True)
for dv, rng in ((dv_id, "A"), (dv_cls, "B"), (dv_pts, "C"), (dv_kind, "D")):
    pt.add_data_validation(dv); dv.add(f"{rng}2:{rng}{ROWS}")
dv_team = DataValidation(type="list", formula1='"' + ",".join(TEAMS) + '"', allow_blank=False, showErrorMessage=True)
cl.add_data_validation(dv_team); dv_team.add("B2:B100")

wb.save("modello/LegacyGroup_foglio.xlsx")
print("ok")
