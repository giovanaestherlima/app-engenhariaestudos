// Banco de dados aprofundado de conteúdos de Engenharia Civil
// Baseado na literatura técnica oficial, NBR 13133, NBR 5681, NBR 11682 e normas DNIT.

export const categories = [
  { id: 'estruturas', name: 'Estruturas', icon: 'structure', count: '12 conteúdos' },
  { id: 'topografia', name: 'Topografia', icon: 'ruler', count: '8 conteúdos' },
  { id: 'terraplenagem', name: 'Terraplenagem', icon: 'mountain', count: '6 conteúdos' },
  { id: 'muros', name: 'Muros de contenção', icon: 'wall', count: '7 conteúdos' },
  { id: 'normas', name: 'NBRs e DNIT', icon: 'book', count: '10 referências' },
  { id: 'hidraulica', name: 'Hidráulica', icon: 'water', count: 'Em breve' },
  { id: 'solos', name: 'Solos', icon: 'mountain', count: 'Em breve' },
  { id: 'orcamento', name: 'Orçamento', icon: 'budget', count: 'Em breve' },
];

export const content = {
  topografia: [
    ['Topografia, topometria e topologia', 'Definição, distinção entre Topografia e Geodésia, escala numérica e cuidado com escalas de área.', ['Topometria', 'Topologia', 'Escala']],
    ['Coordenadas geodésicas e projeção UTM', 'Modelo elipsoidal internacional, latitude/longitude, fusos de 6° da projeção UTM, falsas coordenadas métricas.', ['Datum', 'Fusos', 'UTM']],
    ['Instrumentos e equipamentos de campo', 'Teodolitos, níveis, MED/estação total e instrumentos auxiliares (balizas, miras, prumos e sapatas) da NBR 13133.', ['Estação total', 'Nível', 'NBR 13133']],
    ['Planimetria: Rumos e azimutes', 'Definições, quadrantes (NE, SE, SW, NW), regras de conversão angular e contas em graus, minutos e segundos.', ['Azimute', 'Rumo', 'Quadrantes']],
    ['Poligonais e erro de fechamento', 'Poligonais abertas, fechadas e amarradas, soma teórica dos ângulos internos, erro angular admissível e coordenadas.', ['Poligonal', 'Erro angular', 'Gauss']],
    ['Altimetria e nivelamento', 'Cota versus altitude, nivelamento geométrico simples e composto (AI, ré e vante) e nivelamento trigonométrico.', ['Cotas', 'Nivelamento', 'Zenital']],
    ['Execução e fases do levantamento (NBR 13133)', 'Fases do levantamento, erro de graficismo (0,2 mm × M), princípio da vizinhança e boas práticas nas visadas.', ['NBR 13133', 'Graficismo', 'Vizinhança']],
    ['Curvas de nível e formas do relevo', 'Curvas mestras, intermediárias, interpretação de espigões, talvegues, divisores de águas, vales, elevações e depressões.', ['Relevo', 'Isolinhas', 'Talvegue']],
  ],
  terraplenagem: [
    ['Compensação das massas e empolamento', 'Volume no corte, solto e compactado, taxas de empolamento e contração, e cálculo de viagens de caminhão por densidade.', ['Empolamento', 'Contração', 'Transporte']],
    ['Diagrama de Bruckner e transporte', 'Curva de massas acumuladas, pontos de passagem (máximos e mínimos), linhas de compensação e Distância Média de Transporte (DMT).', ['Bruckner', 'DMT', 'Massas']],
    ['Serviços preliminares (DNIT 104/2009)', 'Desmatamento vs destocamento, cota vermelha, offsets, profundidade de remoção de tocos e caiação de árvores a preservar.', ['DNIT 104', 'Destocamento', 'Cota vermelha']],
    ['Corte e classificação de materiais (DNIT 106/2009)', 'Materiais de 1ª, 2ª e 3ª categoria, rebaixamento de greide em rocha e solos expansivos, e patamares com banquetas.', ['DNIT 106', 'Categorias', 'Banquetas']],
    ['Aterros rodoviários (DNIT 108/2009)', 'Corpo do aterro vs camada final (60 cm), espessuras máximas compactadas, umidade ótima ±3% e grau de compactação 100%.', ['DNIT 108', 'Corpo do aterro', 'CBR/ISC']],
    ['Aterros em edificações (NBR 5681/2015)', 'Casos obrigatórios de controle tecnológico (altura > 1m ou volume > 1000m³), grau de compactação mínimo de 95% e ensaios.', ['NBR 5681', 'Controle', 'Compactação']],
  ],
  muros: [
    ['Sistemas de contenção: rígidos e flexíveis', 'Diferenças de comportamento mecânico, capacidade de absorver deformações e riscos a estruturas vizinhas.', ['Rígidos', 'Flexíveis', 'Deformações']],
    ['Muros de gravidade: pedra, concreto e fogueira', 'Alvenaria de pedra seca até 2m, pedra argamassada com dreno até 3m, concreto ciclópico (base ~50%H) e crib walls.', ['Gravidade', 'Pedra', 'Crib wall']],
    ['Muros de gabião: caixa, colchão e saco', 'Gaiolas de aço galvanizado com pedras, estrutura flexível e drenante, lastro de concreto magro e tipos de aplicação.', ['Gabiões', 'Drenagem', 'Taludes']],
    ['Critérios de estabilidade e NBR 11682', 'Fatores de segurança mínimos: tombamento ≥ 2,0, deslizamento ≥ 1,5, capacidade de carga ≥ 3,0 e terço central da base.', ['NBR 11682', 'Tombamento', 'Deslizamento']],
    ['Muros de flexão em concreto armado', 'Perfis esbeltos em L e T invertido, mobilização do peso do talão, uso de contrafortes e dimensionamento estrutural.', ['Flexão', 'Concreto armado', 'Contrafortes']],
  ],
  estruturas: [
    ['Equilíbrio de estruturas planas', 'Graus de liberdade, vínculos, reações de apoio globais e estaticidade.', ['Isostática', 'Reações', 'Grau estático']],
    ['Diagramas de esforços (N, V, M)', 'Método das seções, convenção de sinais e relações diferenciais entre carregamento, cortante e momento.', ['N', 'V', 'M']],
    ['Método dos binários de extremidade', 'Isolamento de barras, binário de cisalhamento transversal (V_bin = ΔM/L) e superposição com a parcela isostática.', ['Binário', 'Superposição', 'Corte']],
    ['Nós rígidos, rótulas e transmissão de momentos', 'Equilíbrio nodal (ΣM = 0), transmissão de binários entre vigas e pilares, e momento nulo em rótulas internas.', ['Pórticos', 'Nós rígidos', 'Rótulas']],
    ['Cargas distribuídas e seções críticas', 'Resultante, centroide, posição de cortante nulo V(x)=0 e localização do momento fletor máximo.', ['q(x)', 'Seção crítica', 'M_máx']],
  ],
  normas: [
    ['ABNT NBR 13133: Levantamento topográfico', 'Classificação de instrumentos, tolerâncias angulares, erro de graficismo e princípio da vizinhança.', ['Topografia', 'NBR 13133']],
    ['ABNT NBR 5681: Controle de aterros em edificações', 'Condições de obrigatoriedade, frequência mínima de ensaios e critérios de compactação e umidade.', ['Aterros', 'NBR 5681']],
    ['Especificações DNIT (104, 106 e 108/2009)', 'Caderno rodoviário completo para desmatamento, corte e aterro com tolerâncias executivas.', ['DNIT', 'Rodovias']],
    ['ABNT NBR 11682: Estabilidade de encostas e muros', 'Fatores de segurança geotécnicos e estabilidade global do conjunto solo-estrutura.', ['Taludes', 'NBR 11682']],
  ],
  hidraulica: [], solos: [], orcamento: [],
};

export const topographyDetails = [
  // 0: Topografia, topometria e topologia
  [
    { kind: 'teoria', title: 'Topografia versus Geodésia', text: 'A Topografia descreve porções limitadas da superfície terrestre (considerando a Terra plana na área levantada). A Geodésia estuda e mapeia grandes extensões, levando obrigatoriamente em conta a esfericidade e a curvatura terrestre.' },
    { kind: 'teoria', title: 'Topometria e Topologia', text: 'A Topometria reúne os métodos de medição de distâncias, ângulos e desníveis, dividindo-se em Planimetria (projeção horizontal X, Y) e Altimetria (distâncias verticais e cotas Z). A Topologia estuda as formas exteriores do relevo e as leis que regem seu modelado natural.' },
    { kind: 'calculo', title: 'Escala numérica e escala de áreas', text: 'A escala linear E = 1/M = d/D relaciona o tamanho no papel (d) e no terreno real (D). Para áreas, a proporção é quadrática: A_desenho / A_real = (1/M)². Exemplo: na escala 1:200, 60 cm² no papel equivalem a 60 × 200² cm² = 2.400.000 cm² = 240 m² reais.' },
  ],
  // 1: Coordenadas e projeção UTM
  [
    { kind: 'teoria', title: 'Coordenadas geodésicas e Datum', text: 'As coordenadas geodésicas são baseadas no modelo elipsoide de revolução internacional de 1967. A latitude varia de 0° no Equador a 90° (Norte positivo, Sul negativo). A longitude varia de 0° a 180° a partir do Meridiano de Greenwich para leste ou oeste.' },
    { kind: 'teoria', title: 'Sistema de Projeção UTM', text: 'A Projeção Universal Transversa de Mercator (UTM) é cilíndrica, transversa e secante ao esferoide terrestre. A Terra é dividida em 60 fusos longitudinais de 6° cada (numerados de 1 a 60 do antimeridiano de Greenwich para Leste, coincidindo com a Carta ao Milionésimo CIM 1:1.000.000) e 20 faixas latitudinais de 8° (letras C até X, exceto L e O; faixa X possui 12°).' },
    { kind: 'calculo', title: 'Falsas coordenadas métricas UTM', text: 'No Hemisfério Sul, a linha do Equador recebe ordenadas N = 10.000.000 m (decrescendo para o sul). No Meridiano Central de cada fuso, a abscissa E recebe o valor falso de 500.000 m (aumentando para leste até ~830.000 m e diminuindo para oeste até ~160.000 m), evitando coordenadas negativas.' },
  ],
  // 2: Instrumentos de campo
  [
    { kind: 'teoria', title: 'Instrumentos básicos (NBR 13133)', text: 'Os instrumentos básicos são Teodolitos (medem ângulos horizontais e verticais; classificados em baixa precisão ≤ ±30", média ≤ ±07" e alta ≤ ±02"), Níveis (medem inclinações e desníveis planos; baixa > 10 mm/km, média ≤ ±10, alta ≤ ±3 e muito alta ≤ ±1 mm/km) e MEDs (Medidores Eletrônicos de Distância/Distanciômetros e Estações Totais, que combinam medições angulares e lineares com memória e cálculo).' },
    { kind: 'teoria', title: 'Instrumentos auxiliares', text: 'Balizas: hastes de 2 m pintadas a cada 50 cm alternando vermelho e branco com ponteiro de ferro para alinhamento horizontal. Miras: réguas graduadas para nivelamento altimétrico. Prumos: garantem a verticalidade dos equipamentos. Fichas: peças de ferro pontiagudas de 40 cm para marcar alinhamentos. Piquetes e sapatas: estacas de madeira e chapas de apoio no caminhamento.' },
    { kind: 'verificacao', title: 'Sensores meteorológicos de apoio', text: 'Termômetros (correção da dilatação e refração pela temperatura), Barômetros (medem pressão atmosférica e permitem estimar altitude indireta) e Psicrômetros (determinam umidade relativa do ar para calibração).' },
  ],
  // 3: Rumos e azimutes
  [
    { kind: 'teoria', title: 'Definição de Azimute e Rumo', text: 'Azimute é o ângulo horizontal medido a partir do Norte no sentido horário, variando de 0° a 360°. Rumo é o menor ângulo entre a linha Norte-Sul e o alinhamento, variando de 0° a 90°, acompanhado obrigatoriamente do quadrante correspondente (NE, SE, SW ou NW).' },
    { kind: 'calculo', title: 'Regras de conversão por quadrante', text: '1º Quad (NE): Rumo = Az NE; Az = Rumo.\n2º Quad (SE): Rumo = 180° − Az SE; Az = 180° − Rumo.\n3º Quad (SW): Rumo = Az − 180° SW; Az = 180° + Rumo.\n4º Quad (NW): Rumo = 360° − Az NW; Az = 360° − Rumo.' },
    { kind: 'calculo', title: 'Cálculo sexagesimal (graus, minutos e segundos)', text: '1° = 60\' e 1\' = 60". Ao subtrair de 180°, empregue 179° 59\' 60". Exemplo: 180° − 137° 39\' 30" = 179° 59\' 60" − 137° 39\' 30" = 42° 20\' 30".' },
  ],
  // 4: Poligonais e fechamento
  [
    { kind: 'teoria', title: 'Tipos de poligonais', text: 'Poligonal aberta: ponto final não coincide com o inicial; não permite conferir erro linear. Poligonal fechada: parte e retorna ao mesmo ponto inicial, permitindo verificar erro angular e linear. Poligonal amarrada: parte e chega a pontos com coordenadas conhecidas, possibilitando verificação completa.' },
    { kind: 'calculo', title: 'Erro angular e tolerância (NBR 13133)', text: 'Soma teórica dos ângulos internos: Σint = (n − 2) × 180°. Erro angular: f_ang = |Σmedido − Σint|. Erro máximo tolerado: E = 2 · p · √N (onde p é a precisão nominal do aparelho e N o número de estações; se não fornecido, adota-se p = 1,0\').' },
    { kind: 'calculo', title: 'Coordenadas parciais e cálculo de área por Gauss', text: 'Projeções: X = L · sen(α) e Y = L · cos(α). Erro linear: e = √(Ex² + Ey²). A área de uma poligonal fechada é calculada pela Fórmula de Gauss organizando a tabela de coordenadas totais, somando os produtos cruzados e dividindo a diferença por 2: A = |Σ(Xi · Yi+1) − Σ(Yi · Xi+1)| / 2.' },
  ],
  // 5: Altimetria e nivelamento
  [
    { kind: 'teoria', title: 'Cota versus altitude', text: 'Cota é a distância vertical de um ponto referida a uma superfície de nível arbitrária. Altitude é a distância vertical medida em relação ao nível médio do mar (Datum altimétrico de Imbituba/SC).' },
    { kind: 'calculo', title: 'Nivelamento geométrico (visadas ré e vante)', text: 'Altura do Instrumento (AI) = Cota_ré + Leitura_ré (AI = hR + LR). Cota do ponto visado: Cota_vante = AI − Leitura_vante. Desnível entre pontos: Δh = LR − LV (positivo = aclive; negativo = declive). No nivelamento composto: Δh_total = ΣLR − ΣLV.' },
    { kind: 'calculo', title: 'Nivelamento trigonométrico e declividade', text: 'Ângulo zenital (Z): medido a partir da vertical superior (0° a 180°). Ângulo vertical α = 90° − Z. Desnível: Δh = Dh · tg(α) ou Δh = Di · sen(α). Inclinação ou declividade: i = (Δh / Dh) × 100%.' },
  ],
  // 6: Execução do levantamento (NBR 13133)
  [
    { kind: 'norma', title: 'Fases do levantamento topográfico', text: 'A NBR 13133 estabelece as fases obrigatórias: 1) Planejamento e métodos; 2) Apoio topográfico; 3) Levantamento de detalhes; 4) Cálculos e ajustes; 5) Original topográfico; 6) Desenho topográfico final; 7) Relatório técnico.' },
    { kind: 'norma', title: 'Erro de graficismo e acuidade visual', text: 'O erro de graficismo admissível é de 0,2 mm no desenho, que equivale ao dobro da acuidade visual humana (0,1 mm). A menor dimensão representável em planta na escala 1:M é 0,2 mm × M (ex: na escala 1:1.000, 0,2 mm × 1000 = 200 mm = 20 cm).' },
    { kind: 'verificacao', title: 'Princípio da vizinhança e boas práticas', text: 'Todo levantamento deve obedecer ao princípio da vizinhança: pontos novos devem ser amarrados aos pontos vizinhos já conhecidos. No nivelamento, as visadas de ré e vante devem ter comprimentos similares (máximo de 80 m, ideal de 60 m) e a linha de visada deve estar a mais de 50 cm do solo para evitar reverberação térmica.' },
  ],
  // 7: Curvas de nível
  [
    { kind: 'teoria', title: 'Propriedades das curvas de nível', text: 'Curvas de nível são linhas que unem pontos de mesma cota ou altitude. São linhas fechadas que nunca se cruzam nem se bifurcam. Curvas muito próximas indicam declive acentuado (terreno íngreme); curvas afastadas indicam terreno suave/plano.' },
    { kind: 'teoria', title: 'Curvas mestras e interpretação geomorfológica', text: 'Curvas mestras são traçadas com linha mais grossa e cotadas a cada 5 curvas (a 5ª linha é mestra). Espigão: elevação alongada com curvas voltadas para cotas menores. Talvegue: linha mais baixa do vale por onde correm as águas, com curvas apontando para cotas maiores. Depressão: cotas decrescem para o interior.' },
  ],
];

export const summaryExtras = {
  terraplenagem: [
    [
      { kind: 'teoria', title: 'Empolamento, contração e homogeneização', text: 'Solo escavado aumenta de volume devido aos vazios (empolamento: V_solto = V_corte · (1 + E)). Na compactação ocorre redução volumétrica (contração C = V_aterro / V_corte; homogeneização Fh = V_corte / V_aterro). Relação universal dos volumes: V_aterro < V_corte < V_solto.' },
      { kind: 'calculo', title: 'Cálculo de transporte e caminhões', text: 'O dimensionamento do número de caminhões basculantes baseia-se sempre no volume de terra solta (empolada). Ao dispor de massas específicas (natural, solta e compactada), calcula-se a massa total do corte e converte-se em volume solto: V_solto = Massa / ρ_solta.' },
    ],
    [
      { kind: 'teoria', title: 'Diagrama de Bruckner (Diagrama de massas)', text: 'Representa a variação do volume acumulado de solo ao longo da diretriz. Convenção: trecho em corte gera curva ascendente (sinal positivo); trecho em aterro gera curva descendente (sinal negativo). Os picos e vales representam pontos de passagem entre corte e aterro.' },
      { kind: 'calculo', title: 'Linhas de compensação e DMT', text: 'Uma linha de compensação horizontal indica que os volumes de corte e aterro entre os pontos interceptados se anulam perfeitamente. A Distância Média de Transporte é a média ponderada das distâncias pelos volumes: DMT = Σ(Vi · di) / ΣVi.' },
    ],
    [
      { kind: 'norma', title: 'Desmatamento vs Destocamento (DNIT 104/2009)', text: 'Desmatamento: corte e remoção de árvores e arbustos. Árvores com diâmetro ≤ 15 cm e altura até 1m utilizam trator de esteiras; árvores > 15 cm exigem motosserras. Destocamento: escavação e extração de tocos, raízes e camada vegetal orgânica.' },
      { kind: 'verificacao', title: 'Profundidades normativas e cota vermelha', text: 'Nas áreas de corte, a remoção de tocos e raízes deve atingir no mínimo 60 cm abaixo do greide projetado. Em aterros, se a cota vermelha for menor que 2,0 m, retira-se toda a camada superficial com raízes; se for maior que 2,0 m, basta o corte das árvores rente ao solo (sem destocar). A faixa de trabalho admite variação de até +15 cm (nunca negativa).' },
    ],
    [
      { kind: 'norma', title: 'Classificação de materiais de corte (DNIT 106/2009)', text: '1ª Categoria: solos comuns escaváveis com facilidade (tratores e motoescrapers), seixos com diâmetro < 0,15 m.\n2ª Categoria: materiais com resistência intermediária, blocos de rocha de volume < 2 m³ ou diâmetro 0,15 a 1,0 m (exige escarificadores pesados).\n3ª Categoria: rocha sã ou blocos > 2 m³ e diâmetro > 1,0 m que exigem detonação contínua com explosivos.' },
      { kind: 'verificacao', title: 'Rebaixamento de greide e patamares', text: 'Quando ocorre rocha no subleito de corte, rebaixa-se o greide em 40 cm com preenchimento em material inerte. Se o solo apresentar expansão > 2%, o rebaixamento é de 60 cm. Cortes elevados exigem patamares com banquetas de largura mínima de 3 m com valetas revestidas.' },
    ],
    [
      { kind: 'norma', title: 'Corpo do aterro e camada final (DNIT 108/2009)', text: 'O corpo do aterro vai do terreno até 60 cm abaixo do greide (camadas compactadas máx 30 cm, ISC ≥ 2%, expansão ≤ 4%). A camada final compreende os 60 cm superiores (camadas compactadas máx 20 cm, ISC ≥ 6%, expansão ≤ 2%).' },
      { kind: 'verificacao', title: 'Controle de umidade e grau de compactação', text: 'A umidade de campo deve situar-se na faixa de umidade ótima ± 3%. O grau de compactação exigido é GC ≥ 100% da energia do ensaio Proctor correspondente. É terminantemente proibido executar serviços de terraplenagem sob chuva.' },
    ],
    [
      { kind: 'norma', title: 'Controle de aterros em edificações (NBR 5681/2015)', text: 'O controle tecnológico é obrigatório quando o aterro tiver altura > 1,0 m, OU volume > 1000 m³, OU suporte de fundações, pavimentos ou muros de arrimo. O grau de compactação mínimo é GC ≥ 95%.' },
      { kind: 'calculo', title: 'Frequência de amostragem da NBR 5681', text: 'Realizar 9 ensaios de compactação para cada 1000 m³ do mesmo material (se volume > 9000 m³, adiciona-se 1 ensaio). Para massa específica aparente seca in situ, 9 ensaios a cada 500 m³ compactados (mínimo de 2 ensaios por dia de trabalho).' },
    ],
  ],
  muros: [
    [
      { kind: 'teoria', title: 'Muros rígidos versus flexíveis', text: 'Muros rígidos (concreto, alvenaria de pedra, ciclópico) não absorvem deformações do terreno e resistem essencialmente por translação e tombamento do peso próprio. Muros flexíveis (gabiões, terra armada) acomodam deformações e recalques diferenciais sem sofrer ruptura brusca.' },
    ],
    [
      { kind: 'teoria', title: 'Tipos de muros de gravidade', text: 'Pedra arrumada manualmente (seca): permeável, dispensa sistema drenante, altura limite de 2 m. Pedra argamassada: impermeável, exige drenos e barbacãs, altura limite de 3 m. Concreto ciclópico: trapezoidal com largura da base da ordem de 50% da altura (B ≈ 0,5 H). Muros em fogueira (crib walls): módulos pré-moldados interligados e preenchidos com brita.' },
    ],
    [
      { kind: 'teoria', title: 'Gabião: caixa, colchão e saco', text: 'Gabião Caixa: prismático retangular, utilizado para contenção por gravidade e apoios de pontes. Gabião Colchão: grande área e pequena espessura, indicado para proteção de margens e canais. Gabião Saco: cilíndrico, montado para obras emergenciais e com presença de água. Devem ser assentados sobre lastro de concreto magro para nivelamento do terreno.' },
    ],
    [
      { kind: 'norma', title: 'Fatores de segurança mínimos (NBR 11682)', text: 'Para estabilidade de muros de arrimo (gravidade e flexão), as exigências normativas são:\n• Tombamento: FS ≥ 2,0\n• Deslizamento na base: FS ≥ 1,5\n• Capacidade de carga da fundação: FS ≥ 3,0\nA resultante dos esforços deve passar no terço central da base (excentricidade e ≤ B/6) para evitar tensões de tração.' },
    ],
    [
      { kind: 'teoria', title: 'Muros de flexão e contrafortes', text: 'Estruturas de concreto armado em forma de L ou T invertido. A sapata/talão utiliza o peso do solo aterrado sobre a base para auxiliar na estabilização ao tombamento. Para alturas elevadas, instalam-se contrafortes verticais espaçados para enrijecer o fuste.' },
    ],
  ],
  estruturas: [
    [
      { kind: 'teoria', title: 'Graus de liberdade e vínculos', text: 'No plano, um corpo rígido possui 3 GL (translações X, Y e rotação). Apoio móvel/rolete restringe 1 GL; apoio fixo/articulado restringe 2 GL; engaste restringe 3 GL. O grau estático global é gh = Reações + Vínculos Internos − 3 × Barras.' },
      { kind: 'calculo', title: 'Equilíbrio estático global', text: 'Para qualquer estrutura isostática em equilíbrio: ΣFx = 0, ΣFy = 0 e ΣM_ponto = 0.' },
    ],
    [
      { kind: 'teoria', title: 'Convenção de sinais dos esforços (N, V, M)', text: 'Normal N positivo: tração. Cortante V positivo: tende a girar o elemento no sentido horário. Momento fletor M positivo: traciona as fibras inferiores da barra (diagrama desenhado do lado tracionado).' },
      { kind: 'calculo', title: 'Relações diferenciais fundamentais', text: 'dV/dx = −q(x) (o carregamento transversal define a inclinação do cortante) e dM/dx = V(x) (o esforço cortante é a derivada do momento fletor). Sob carga uniforme, o cortante é linear e o momento é parabólico.' },
    ],
    [
      { kind: 'teoria', title: 'O método dos binários de extremidade', text: 'Cada barra isolada é equilibrada à rotação pelo binário de forças de cisalhamento: V_bin = (M_final − M_inicial) / L. Este binário produz um par de forças transversais com braço L que transfere momentos aos nós adjacentes.' },
      { kind: 'calculo', title: 'Superposição de esforços na barra', text: 'Cortante total: V(x) = V_isostático(x) + V_bin. Momento fletor: M(x) = M_isostático(x) + M_inicial + (ΔM / L) · x. O momento máximo ocorre exatamente onde o cortante se anula (V(x) = 0).' },
    ],
    [
      { kind: 'teoria', title: 'Transmissão nodal de binários', text: 'Em um nó rígido entre várias barras, a soma dos momentos de extremidade deve ser nula (ΣM_nó = 0). O momento de flexão atuante na ponta de uma barra é transmitido integralmente como binário reativo para as barras concorrentes.' },
      { kind: 'teoria', title: 'Rótula interna (momento nulo)', text: 'Uma rótula interna transmite forças normais e cortantes, mas não transmite flexão: M_rótula = 0 em todas as extremidades que chegam à articulação.' },
    ],
    [
      { kind: 'calculo', title: 'Cargas distribuídas e seção crítica', text: 'Para carga uniforme q em vão L: resultante Q = q · L no ponto L/2. Na viga biapoiada, reações isostáticas V0 = qL/2 e momento máximo de campo M0_max = qL²/8. Seções de cortante nulo V=0 sempre coincidem com máximos ou mínimos do momento.' },
    ],
  ],
  normas: [
    [
      { kind: 'norma', title: 'ABNT NBR 13133: Levantamentos', text: 'Regula o levantamento topográfico no Brasil. Exige que todo levantamento obedeça ao princípio da vizinhança. Define o erro de graficismo como 0,2 mm vezes o módulo da escala e limita o espaçamento de visadas em 80 m (ideal 60 m).' },
    ],
    [
      { kind: 'norma', title: 'ABNT NBR 5681: Aterros em Edificações', text: 'Estabelece os parâmetros de controle tecnológico para obras prediais. Fixa GC ≥ 95%, umidade na faixa ótima ± 3% e frequência de 9 ensaios a cada 1000 m³.' },
    ],
    [
      { kind: 'norma', title: 'Caderno de especificações DNIT', text: 'DNIT 104/2009 (serviços preliminares e destocamento), DNIT 106/2009 (cortes e classificação de 1ª a 3ª categoria) e DNIT 108/2009 (aterros, corpo e camada final de 60 cm).' },
    ],
    [
      { kind: 'norma', title: 'ABNT NBR 11682: Estabilidade de taludes e encostas', text: 'Fixa fatores de segurança contra tombamento (2,0), deslizamento (1,5) e ruptura da fundação (3,0) para contenções.' },
    ],
  ],
};

export const fullLessons = {
  // TOPOGRAFIA
  'Topografia versus Geodésia': {
    intro: 'A principal distinção técnica entre Topografia e Geodésia reside na consideração da curvatura terrestre e na escala das dimensões mapeadas.',
    formulas: 'Superfície plana: válida para raios até 20 a 30 km (área ≤ ~1.000 km²).\nAcima deste limite: curvatura terrestre não pode ser ignorada → Geodésia.',
    sections: [
      { title: 'Conceito e Campo de Atuação', text: 'A Topografia (do grego topos = lugar e graphein = descrever) dedica-se à representação gráfica de porções restritas da superfície da Terra. Nela, o plano de referência é considerado plano, pois o erro decorrente da curvatura terrestre é desprezível para a escala dos trabalhos usuais de engenharia.\n\nA Geodésia estuda a forma e as dimensões da Terra, determinando o campo de gravidade e mapeando grandes extensões de continentes, fundamentando o Sistema Geodésico Brasileiro (SGB).' },
    ],
    example: {
      title: 'Diferenciação conceitual em concursos',
      text: 'Pergunta clássica de concurso: A Topografia substitui a Geodésia em grandes obras?\nNão. Em obras de infraestrutura que excedem dezenas de quilômetros (ferrovias, rodovias, linhas de transmissão), as coordenadas topográficas locais devem ser amarradas ao Sistema Geodésico via projeção UTM.'
    },
    questions: [
      {
        banca: 'FGV - COMPESA',
        prompt: 'Em Topografia, a determinação das coordenadas X e Y dos pontos no terreno é possível devido ao processo denominado:\na) altimetria.\nb) topologia.\nc) planimetria.\nd) geologia.\ne) batimetria.',
        options: ['a) altimetria', 'b) topologia', 'c) planimetria', 'd) geologia', 'e) batimetria'],
        gabarito: 'Alternativa C (planimetria)',
        solution: 'A planimetria é o ramo da topometria encarregado da determinação das coordenadas horizontais (X e Y) no plano de projeção horizontal. A altimetria determina cotas e desníveis (Z) e a topologia estuda a forma do relevo.'
      }
    ],
    caution: 'A Topografia é considerada parte da Geodésia para áreas locais, mas não leva em conta o raio esférico da Terra nos seus cálculos básicos de planimetria.'
  },

  'Escala numérica e escala de áreas': {
    intro: 'O domínio das escalas lineares e, principalmente, das escalas superficiais (de área) é essencial para dimensionamento correto de projetos e questões de concurso.',
    formulas: 'Escala linear: E = d / D = 1 / M (onde d = desenho e D = real, na mesma unidade)\nEscala de área: A_desenho / A_real = (1 / M)² = 1 / M²',
    sections: [
      { title: 'Regra de Três Quadrática para Áreas', text: 'Ao trabalhar com distâncias lineares, aplicamos a escala diretamente (ex: 1 cm representa M cm). Porém, para áreas (m² ou cm²), cada dimensão é reduzida por M, de modo que a área representada fica reduzida por M².' },
    ],
    stepByStep: [
      { title: 'Passo 1: Identificar a escala linear', text: 'Ex: Escala 1:200 significa M = 200.' },
      { title: 'Passo 2: Elevar a escala ao quadrado', text: '1 cm² no papel equivale a 200² cm² = 40.000 cm² no terreno.' },
      { title: 'Passo 3: Converter unidades para m²', text: 'Como 1 m² = 10.000 cm², 40.000 cm² = 4 m². Logo, 1 cm² no desenho = 4 m² reais.' }
    ],
    example: {
      title: 'Cálculo de Área Real a partir do Desenho',
      text: 'Um lote retangular mede 12 cm × 5 cm em uma planta na escala 1:200. Calcule a área real:\n1) Área no desenho = 12 × 5 = 60 cm².\n2) Relação de área: 1 cm² : 200² cm² → 1 cm² : 40.000 cm².\n3) Área real = 60 × 40.000 = 2.400.000 cm² = 240 m².'
    },
    questions: [
      {
        banca: 'AOCP - Pref. São Bento do Sul',
        prompt: 'Se uma determinada rua estiver desenhada com 18 mm de comprimento e mede 360 m na realidade, qual é a escala do desenho?\na) 1: 200.\nb) 1: 2.000.\nc) 1: 20.000.\nd) 1: 200.000.',
        options: ['a) 1: 200', 'b) 1: 2.000', 'c) 1: 20.000', 'd) 1: 200.000'],
        gabarito: 'Alternativa C (1: 20.000)',
        solution: 'Convertendo para a mesma unidade (cm):\nd = 18 mm = 1,8 cm.\nD = 360 m = 36.000 cm.\nEscala E = d / D = 1,8 / 36.000 = 1 / 20.000 → Escala 1:20.000.'
      },
      {
        banca: 'IBADE - IF-RO',
        prompt: 'Um automóvel mede 5 m na realidade e em uma planta mede 2,5 cm. A escala utilizada é:\na) 1:100\nb) 1:200\nc) 1:500\nd) 1:250',
        options: ['a) 1:100', 'b) 1:200', 'c) 1:500', 'd) 1:250'],
        gabarito: 'Alternativa B (1:200)',
        solution: 'Comprimento real = 5 m = 500 cm. Comprimento no desenho = 2,5 cm.\nMódulo M = 500 / 2,5 = 200. Escala 1:200.'
      }
    ],
    caution: 'Nunca multiplique a área em cm² diretamente por M. Multiplique sempre por M² e converta para m² dividindo por 10.000.'
  },

  'Sistema de Projeção UTM': {
    intro: 'A projeção Universal Transversa de Mercator é a base do mapeamento topográfico e cartográfico moderno no Brasil.',
    formulas: 'Fusos: 60 fusos de 6° de longitude (numerados de 1 a 60 a partir de 180° W para Leste).\nFaixas: 20 faixas latitudinais de 8° (C até X, excluindo L e O; faixa X tem 12° de 72°N a 84°N).\nCoordenadas Planas:\n• Norte: Equador Sul = 10.000.000 m (diminui para o Sul); Equador Norte = 0 m.\n• Este: Meridiano Central = 500.000 m (160.000 m a 830.000 m).',
    sections: [
      { title: 'Conformidade e Sistema de Fusos', text: 'O sistema UTM adota um cilindro transverso secante à Terra. Para que as deformações de escala fiquem dentro de limites toleráveis (fator de escala k = 0,9996 no meridiano central), a Terra é dividida em 60 fusos de 6°. Cada fuso possui seu próprio meridiano central.' },
      { title: 'Coordenadas Falsas (False Easting e False Northing)', text: 'Para evitar números negativos nos levantamentos:\n1) No eixo Y (Norte), atribui-se ao Equador no Hemisfério Sul a cota de 10.000.000 m, decrescendo à medida que se viaja para o Polo Sul.\n2) No eixo X (Este), o meridiano central de cada fuso recebe a coordenada 500.000 m. Pontos a oeste do meridiano central possuem E < 500.000 m e a leste E > 500.000 m.' }
    ],
    questions: [
      {
        banca: 'VUNESP - SeMAE',
        prompt: 'Muitos levantamentos cadastrais georreferenciados utilizam o sistema UTM, que divide a Terra em X fusos, que se estendem por Y graus de longitude cada. Os valores de X e Y são respectivamente:\na) 10 e 36.\nb) 20 e 18.\nc) 30 e 12.\nd) 40 e 9.\ne) 60 e 6.',
        options: ['a) 10 e 36', 'b) 20 e 18', 'c) 30 e 12', 'd) 40 e 9', 'e) 60 e 6'],
        gabarito: 'Alternativa E (60 e 6)',
        solution: 'O sistema UTM divide longitudinalmente o globo em 60 fusos de 6° cada (60 × 6° = 360°).'
      },
      {
        banca: 'IESES - Pref. Palhoça',
        prompt: 'Sobre a projeção UTM, assinale V ou F:\n( ) Adotado pelo Sistema Cartográfico Brasileiro.\n( ) Decomposição em fusos de 6° coincidentes com a Carta Internacional ao Milionésimo.\n( ) Coordenadas planas indicadas pelas letras N e E sem sinal.\n( ) Numeração dos fusos de 1 a 60 a contar do antimeridiano de Greenwich para leste.\nSequência correta:\na) V, V, V, V\nb) V, F, V, F\nc) V, V, V, F\nd) V, V, F, F',
        options: ['a) V, V, V, V', 'b) V, F, V, F', 'c) V, V, V, F', 'd) V, V, F, F'],
        gabarito: 'Alternativa A (V, V, V, V)',
        solution: 'Todas as quatro afirmativas refletem fielmente as normas e prescrições da ABNT NBR 13133 para o sistema UTM.'
      }
    ],
    caution: 'As letras L e O não são utilizadas na designação das faixas latitudinais para evitar confusão com os numerais 1 e 0.'
  },

  'Instrumentos básicos (NBR 13133)': {
    intro: 'A NBR 13133 classifica com rigor a aparelhagem topográfica conforme o desvio padrão de medição.',
    formulas: 'Teodolitos:\n• Baixa precisão: dp ≤ ±30"\n• Média precisão: dp ≤ ±07"\n• Alta precisão: dp ≤ ±02"\nNíveis:\n• Baixa: dp > 10 mm/km\n• Média: dp ≤ ±10 mm/km\n• Alta: dp ≤ ±3 mm/km\n• Muito alta: dp ≤ ±1 mm/km',
    sections: [
      { title: 'Estações Totais e Distanciômetros Eletrônicos (MED)', text: 'Os MED medem distâncias por infravermelho ou laser e devem ser calibrados a cada 2 anos no máximo. A Estação Total combina o MED com teodolito eletrônico e microprocessador interno, calculando distâncias reduzidas, desníveis e coordenadas tridimensionais diretamente no campo.' }
    ],
    questions: [
      {
        banca: 'Pref. Petrolina / PE',
        prompt: 'O instrumento eletrônico utilizado para medições topográficas que afere ângulos verticais e horizontais e distâncias lineares, capaz de armazenar dados e executar cálculos em campo, é:\na) Teodolito\nb) Nível\nc) Distanciômetro eletrônico\nd) GPS\ne) Estação Total',
        options: ['a) Teodolito', 'b) Nível', 'c) Distanciômetro eletrônico', 'd) GPS', 'e) Estação Total'],
        gabarito: 'Alternativa E (Estação Total)',
        solution: 'A estação total reúne teodolito (ângulos), distanciômetro (distâncias lineares) e computador de bordo em um único equipamento.'
      },
      {
        banca: 'COMPESA',
        prompt: 'Haste de 2 m pintada a cada 50 cm com cores alternadas entre vermelho e branco com ponteiro de ferro na extremidade inferior é denominada:\na) baliza\nb) nível\nc) piquete\nd) mira\ne) teodolito',
        options: ['a) baliza', 'b) nível', 'c) piquete', 'd) mira', 'e) teodolito'],
        gabarito: 'Alternativa A (baliza)',
        solution: 'Balizas mantêm o alinhamento horizontal durante medições diretas ou visadas, devendo permanecer rigorosamente na vertical.'
      }
    ],
    caution: 'Erros de centralização do instrumento e do prisma/alvo representam a maior fonte de imprecisão angular, agravando-se quanto menores forem os lados da poligonal.'
  },

  'Regras de conversão por quadrante': {
    intro: 'Rumos e azimutes expressam a orientação de um alinhamento topográfico sob referenciais distintos.',
    formulas: '1º Quadrante (0° a 90°): Rumo = Az NE | Az = Rumo\n2º Quadrante (90° a 180°): Rumo = 180° − Az SE | Az = 180° − Rumo\n3º Quadrante (180° a 270°): Rumo = Az − 180° SW | Az = 180° + Rumo\n4º Quadrante (270° a 360°): Rumo = 360° − Az NW | Az = 360° − Rumo',
    sections: [
      { title: 'Diferença entre Azimute e Rumo', text: 'O Azimute parte sempre do Norte e gira em sentido horário (0° a 360°). O Rumo é o menor ângulo formado entre a direção considerada e o eixo Norte-Sul (sempre de 0° a 90°), exigindo a identificação do quadrante.' },
    ],
    stepByStep: [
      { title: 'Identifique o quadrante do alinhamento', text: 'Ângulos de 0° a 90° estão em NE; de 90° a 180° em SE; de 180° a 270° em SW; de 270° a 360° em NW.' },
      { title: 'Aplique a equação do quadrante', text: 'Se azimute 220° (3º quadrante SW), faça Rumo = 220° − 180° = 40° SW.' },
      { title: 'Subtrações sexagesimais', text: 'Para subtrair minutos e segundos de 180°, empregue 179° 59\' 60".' }
    ],
    example: {
      title: 'Conversão com Minutos e Segundos',
      text: 'Converter Rumo = 32° 20\' 30" SE em Azimute:\nComo está no 2º quadrante (SE): Az = 180° − Rumo.\n179° 59\' 60" − 32° 20\' 30" = 147° 39\' 30".\nLogo, Azimute = 147° 39\' 30".'
    },
    questions: [
      {
        banca: 'Inst. Unifil - Pref. Mandaguaçu',
        prompt: 'O azimute de 220° equivale a qual rumo?\na) 220° NW\nb) 140° NS\nc) 50° WS\nd) 40° SW\ne) 130° EW',
        options: ['a) 220° NW', 'b) 140° NS', 'c) 50° WS', 'd) 40° SW', 'e) 130° EW'],
        gabarito: 'Alternativa D (40° SW)',
        solution: 'Azimute 220° está entre 180° e 270° (quadrante SW). Rumo = 220° − 180° = 40° SW.'
      },
      {
        banca: 'IBADE - Pref. Jaru / RO',
        prompt: 'O azimute correspondente ao rumo 32° 20\' 30" SE é:\na) 212° 20\' 30"\nb) 147° 39\' 30"\nc) 327° 39\' 30"\nd) 302° 20\' 30"\ne) 58° 40\' 30"',
        options: ['a) 212° 20\' 30"', 'b) 147° 39\' 30"', 'c) 327° 39\' 30"', 'd) 302° 20\' 30"', 'e) 58° 40\' 30"'],
        gabarito: 'Alternativa B (147° 39\' 30")',
        solution: 'Quadrante SE: Az = 180° − Rumo = 179° 59\' 60" − 32° 20\' 30" = 147° 39\' 30".'
      }
    ],
    caution: 'O valor do rumo nunca pode exceder 90° e nunca deve ser escrito sem a sigla do quadrante (NE, SE, SW, NW).'
  },

  'Erro angular e tolerância (NBR 13133)': {
    intro: 'Em uma poligonal fechada, a verificação angular é a primeira checagem antes de distribuir correções às coordenadas.',
    formulas: 'Soma teórica dos ângulos internos: Σint = (n − 2) × 180°\nErro angular medido: f_ang = |Σmed − Σint|\nTolerância máxima admissível: E_máx = 2 · p · √N\n(onde p = precisão do teodolito em minutos, N = número de vértices)',
    sections: [
      { title: 'Condição de Aceitação', text: 'Se o erro angular f_ang for menor ou igual à tolerância E_máx, o levantamento é aprovado e o erro é distribuído igualmente entre os vértices. Se f_ang > E_máx, a poligonal deve ser refeita em campo.' }
    ],
    example: {
      title: 'Verificação de Quadrilátero',
      text: 'Um quadrilátero (n = 4) medido com teodolito de precisão 1\' forneceu soma dos ângulos internos = 361° 48\'.\n1) Σint = (4 − 2) × 180° = 360°.\n2) Erro angular = 361° 48\' − 360° = 1° 48\' = 108\'.\n3) Tolerância E_máx = 2 × 1\' × √4 = 4\'.\nComo 108\' > 4\', a poligonal foi reprovada.'
    },
    questions: [
      {
        banca: 'Bio-Rio - Eletrobras',
        prompt: 'Os ângulos internos medidos de uma poligonal de 4 vértices somaram: 64°08\' + 127°04\' + 55°24\' + 115°12\' = 361°48\'. O erro de fechamento angular vale, em módulo:\na) 0° 17\'\nb) 0° 34\'\nc) 0° 52\'\nd) 1° 39\'\ne) 1° 48\'',
        options: ['a) 0° 17\'', 'b) 0° 34\'', 'c) 0° 52\'', 'd) 1° 39\'', 'e) 1° 48\''],
        gabarito: 'Alternativa E (1° 48\')',
        solution: 'Para n=4, Σteórica = (4−2)×180° = 360°. Erro = 361°48\' − 360° = 1°48\'.'
      },
      {
        banca: 'FGV - AL-RO',
        prompt: 'Para que o erro de fechamento angular de uma poligonal fechada de 5 lados seja nulo, a soma dos ângulos internos deve ser:\na) 240°\nb) 360°\nc) 420°\nd) 540°\ne) 720°',
        options: ['a) 240°', 'b) 360°', 'c) 420°', 'd) 540°', 'e) 720°'],
        gabarito: 'Alternativa D (540°)',
        solution: 'Σint = (n − 2) × 180° = (5 − 2) × 180° = 3 × 180° = 540°.'
      }
    ],
    caution: 'Erros pequenos não garantem ausência de falhas se tiver havido compensação fortuita de erros de sinais opostos.'
  },

  'Coordenadas parciais e cálculo de área por Gauss': {
    intro: 'O cálculo das projeções parciais fundamenta o erro de fechamento linear, e a fórmula de Gauss permite calcular a área de qualquer polígono sem subdivisão triangular manual.',
    formulas: 'Coordenadas parciais: X = L · sen(α) e Y = L · cos(α)\nErro linear total: e = √(Ex² + Ey²)\nÁrea por Gauss: A = 0,5 · |Σ(Xi · Yi+1) − Σ(Yi · Xi+1)|',
    sections: [
      { title: 'Método dos Produtos Cruzados de Gauss', text: 'Monta-se uma tabela com as coordenadas totais (X, Y) de todos os vértices em sequência perimétrica. Repete-se obrigatoriamente o primeiro ponto no final da tabela. Multiplicam-se os valores nas diagonais principais e secundárias, subtraindo os somatórios e dividindo por 2.' }
    ],
    example: {
      title: 'Cálculo de Área de Triângulo',
      text: 'Vértices: A(100, 30), B(130, 70), C(160, 50). Repetindo A(100, 30):\nDiagonais X: 100×70 + 130×50 + 160×30 = 7.000 + 6.500 + 4.800 = 18.300 m².\nDiagonais Y: 30×130 + 70×160 + 50×100 = 3.900 + 11.200 + 5.000 = 20.100 m².\nÁrea = |18.300 − 20.100| / 2 = 1.800 / 2 = 900 m².'
    },
    questions: [
      {
        banca: 'Pref. Acaraú / CE',
        prompt: 'Em uma poligonal triangular fechada, as diferenças de coordenadas de retorno foram Ex = 120,57 − 120,51 = 0,06 m e Ey = 20,44 − 20,52 = −0,08 m. O erro linear total de fechamento é de:\na) 6 cm\nb) 10 cm\nc) 16 cm\nd) 20 cm\ne) 26 cm',
        options: ['a) 6 cm', 'b) 10 cm', 'c) 16 cm', 'd) 20 cm', 'e) 26 cm'],
        gabarito: 'Alternativa B (10 cm)',
        solution: 'e = √(Ex² + Ey²) = √(0,06² + 0,08²) = √(0,0036 + 0,0064) = √0,01 = 0,10 m = 10 cm.'
      },
      {
        banca: 'FGV - Compesa',
        prompt: 'Segmento AB = 5 m (rumo 30° NE), segmento BC = 6 m (rumo 60° NE). Ponto A: X=20m, Y=30m. Coordenadas de C:\na) 27,72m e 37,35m\nb) 27,72m e 37,72m\nc) 29,57m e 35,62m\nd) 29,57m e 38,50m',
        options: ['a) 27,72m e 37,35m', 'b) 27,72m e 37,72m', 'c) 29,57m e 35,62m', 'd) 29,57m e 38,50m'],
        gabarito: 'Alternativa A (27,72m e 37,35m)',
        solution: 'X_AB = 5·sen(30°) = 2,5m; Y_AB = 5·cos(30°) = 4,35m.\nX_BC = 6·cos(30°) = 5,22m; Y_BC = 6·sen(30°) = 3,0m.\nXc = 20 + 2,5 + 5,22 = 27,72 m e Yc = 30 + 4,35 + 3,0 = 37,35 m.'
      }
    ],
    caution: 'Não esqueça de repetir o primeiro vértice na última linha da tabela de Gauss; sem fechar a figura, o resultado será errôneo.'
  },

  'Nivelamento geométrico (visadas ré e vante)': {
    intro: 'O nivelamento geométrico é o método altimétrico mais exato, medindo desníveis diretamente com níveis ópticos/digitais e miras verticais.',
    formulas: 'Altura do Instrumento: AI = Cota_ré + Leitura_ré\nCota do Ponto: Cota_ponto = AI − Leitura_vante\nDesnível direto: Δh = Leitura_ré − Leitura_vante (Δh > 0 = aclive; Δh < 0 = declive)\nNivelamento Composto: Δh_total = Σ(Leituras de Ré) − Σ(Leituras de Vante)',
    sections: [
      { title: 'Método da Altura do Instrumento (AI)', text: 'Instalado o nível, faz-se uma visada de Ré na mira posicionada sobre ponto de cota conhecida. A linha de visada do nível forma o plano horizontal de referência na cota AI. Qualquer visada de Vante permite obter a cota do novo ponto subtraindo a leitura da mira de AI.' }
    ],
    example: {
      title: 'Cota de Ponto Visado',
      text: 'RN = 100,000 m. Leitura de ré na RN = 1,420 m → AI = 101,420 m.\nLeitura de vante em B = 2,050 m.\nCota de B = 101,420 − 2,050 = 99,370 m.\nDesnível = 1,420 − 2,050 = −0,630 m (declive).'
    },
    questions: [
      {
        banca: 'FUNDEP - Pref. Uberlândia',
        prompt: 'Em um nivelamento geométrico, dois pontos A e B apresentaram desnível de 3 m. Na caderneta consta leitura de RÉ de 3.200 mm na RN e leitura de VANTE de 300 mm no ponto A. A leitura de VANTE de B vale em milímetros:\na) 200\nb) 303\nc) 3.300\nd) 6.200',
        options: ['a) 200', 'b) 303', 'c) 3.300', 'd) 6.200'],
        gabarito: 'Alternativa C (3.300 mm)',
        solution: 'Leitura em B = Δh + Leitura em A = 3.000 mm + 300 mm = 3.300 mm.'
      },
      {
        banca: 'FCM - Pref. Caranaíba',
        prompt: 'Nivelamento composto de estaca 0 a 9. Estaca 0 cota = 100,000 m. ΣRé = 2,504 + 0,750 + 1,700 = 4,954 m. ΣVante = 1,906 + 0,450 + 3,102 = 5,458 m. A cota da estaca 9 vale:\na) 96,898 m\nb) 98,604 m\nc) 99,496 m\nd) 100,504 m',
        options: ['a) 96,898 m', 'b) 98,604 m', 'c) 99,496 m', 'd) 100,504 m'],
        gabarito: 'Alternativa C (99,496 m)',
        solution: 'Δh = ΣRé − ΣVante = 4,954 − 5,458 = −0,504 m. Cota(9) = 100,000 − 0,504 = 99,496 m.'
      }
    ],
    caution: 'Miras não podem se apoiar diretamente no solo natural mole; devem assentar em sapatas metálicas ou pinos firmes.'
  },

  // TERRAPLENAGEM
  'Empolamento, contração e homogeneização': {
    intro: 'A alteração do volume de solo nas operações de escavação, transporte e compactação rege todo o dimensionamento de terraplenagem.',
    formulas: 'Empolamento: V_solto = V_corte · (1 + E)\nContração: C = V_aterro / V_corte\nFator de Homogeneização: Fh = V_corte / V_aterro\nRelação de Volumes: V_aterro < V_corte < V_solto\nNúmero de viagens = V_solto / Capacidade_caçamba',
    sections: [
      { title: 'Conceito de Empolamento', text: 'Ao ser escavado, o solo se desagrega e o índice de vazios aumenta, embora a massa dos grãos permaneça idêntica. Esse acréscimo de volume é o empolamento. Caminhões transportam solo solto (empolado).' },
      { title: 'Relações por Densidade', text: 'Se o problema fornecer massas específicas (natural ρ_nat, solto ρ_solto, compactado ρ_comp):\nMassa = V_corte × ρ_nat = V_solto × ρ_solto = V_comp × ρ_comp.' }
    ],
    example: {
      title: 'Cálculo de Viagens por Densidade de Solo',
      text: 'V_corte = 1.252 m³ (ρ_nat = 1.200 kg/m³), necessidade de aterro compactado V_comp = 592 m³ (ρ_comp = 1.900 kg/m³), ρ_solto = 900 kg/m³. Caçamba = 12 m³. Quantas viagens para transportar o excedente?\n1) Massa corte = 1.252 × 1.200 = 1.502.400 kg.\n2) Massa aterro = 592 × 1.900 = 1.124.800 kg.\n3) Massa excedente para bota-fora = 1.502.400 − 1.124.800 = 377.600 kg.\n4) Volume solto a transportar = 377.600 / 900 = 420 m³.\n5) Viagens = 420 / 12 = 35 viagens.'
    },
    questions: [
      {
        banca: 'CETRDE - Pref. São Gonçalo do Amarante',
        prompt: 'Qual o volume de um buraco criado após a retirada de 300 m³ de solo medido após a escavação (volume solto)? Sabe-se que o empolamento é de 20%.\na) 300 m³\nb) 275 m³\nc) 250 m³\nd) 225 m³\ne) 200 m³',
        options: ['a) 300 m³', 'b) 275 m³', 'c) 250 m³', 'd) 225 m³', 'e) 200 m³'],
        gabarito: 'Alternativa C (250 m³)',
        solution: 'V_solto = V_corte · (1 + E) → 300 = V_corte · (1 + 0,20) → V_corte = 300 / 1,20 = 250 m³.'
      },
      {
        banca: 'UFRJ',
        prompt: 'O percentual obtido com a divisão do volume de aterro pelo volume de corte, de modo a obter a relação volumétrica entre ambos, é designado como:\na) empolamento\nb) fator de conversão\nc) contração\nd) fator de eficiência',
        options: ['a) empolamento', 'b) fator de conversão', 'c) contração', 'd) fator de eficiência'],
        gabarito: 'Alternativa C (contração)',
        solution: 'A contração (C) é a razão entre o volume compactado no aterro e o volume escavado no corte (V_aterro / V_corte).'
      }
    ],
    caution: 'Nunca calcule a frota de caminhões basculantes pelo volume de corte ou de aterro; caminhões transportam exclusivamente solo fofo/empolado.'
  },

  'Diagrama de Bruckner (Diagrama de massas)': {
    intro: 'O diagrama de massas é o instrumento gráfico clássico para equilibrar volumes de corte e aterro e minimizar custos de transporte.',
    formulas: 'DMT = Σ(Vi · di) / ΣVi\nMomento de Transporte = Volume × DMT',
    sections: [
      { title: 'Leitura Gráfica da Linha de Bruckner', text: '• Linha ascendente (subindo): trecho onde o greide corta o terreno (corte).\n• Linha descendente (descendo): trecho onde o greide está sobre o terreno (aterro).\n• Ponto de máximo relativo: transição de corte para aterro.\n• Ponto de mínimo relativo: transição de aterro para corte.\n• Linha de compensação: reta horizontal que corta o diagrama. O volume entre duas interseções compensa-se internamente (volume acumulado nulo).' }
    ],
    questions: [
      {
        banca: 'AL-RO',
        prompt: 'No Diagrama de Bruckner com curvas onduladas, os trechos de corte situam-se:\na) onde a linha é descendente\nb) onde a linha é ascendente\nc) nos pontos de máximo absoluto\nd) nos pontos de mínimo absoluto',
        options: ['a) onde a linha é descendente', 'b) onde a linha é ascendente', 'c) nos pontos de máximo absoluto', 'd) nos pontos de mínimo absoluto'],
        gabarito: 'Alternativa B (onde a linha é ascendente)',
        solution: 'Pela convenção do DNIT, o volume de corte é acumulado positivamente, fazendo a curva subir (ascendente).'
      },
      {
        banca: 'TCM / SP',
        prompt: 'Trator de esteiras opera com produtividade de 320 m³/h. Uma equipe de 4 motoscrapers opera com produtividade de 0,8 (20% improdutiva). A produtividade máxima de cada motoscraper é:\na) 64 m³/h\nb) 100 m³/h\nc) 102,4 m³/h\nd) 128 m³/h',
        options: ['a) 64 m³/h', 'b) 100 m³/h', 'c) 102,4 m³/h', 'd) 128 m³/h'],
        gabarito: 'Alternativa B (100 m³/h)',
        solution: 'Para 100% de hora: 320 / 0,8 = 400 m³/h para os 4 equipamentos. Dividindo por 4 motoscrapers = 100 m³/h cada.'
      }
    ],
    caution: 'A linha de compensação não deve ser traçada sem considerar a viabilidade física de transporte e sentidos de tráfego dos caminhões e tratores.'
  },

  'Classificação de materiais de corte (DNIT 106/2009)': {
    intro: 'A categoria dos materiais de escavação define os equipamentos necessários, a produtividade e a remuneração contratual.',
    formulas: '1ª Categoria: solos comuns em geral, seixos d < 0,15 m.\n2ª Categoria: rocha alterada, blocos volume < 2 m³ ou diâmetro 0,15 m a 1,0 m.\n3ª Categoria: rocha sã, blocos volume > 2 m³ ou diâmetro > 1,0 m (explosivos contínuos).',
    sections: [
      { title: 'Rebaixamento de greide em cortes', text: 'Ao atingir rocha sã ou decomposta no nível do subleito, a norma DNIT 106/2009 exige rebaixar o greide em 40 cm e preencher com material inerte. Se o solo tiver expansão > 2% e baixo suporte, o rebaixamento é de 60 cm.' }
    ],
    questions: [
      {
        banca: 'FCC - EMAE-SP',
        prompt: 'Durante a terraplenagem, o material excedente foi considerado como de 2ª categoria. Esse tipo de material:\na) exige emprego contínuo de explosivos\nb) inclui os blocos de rocha de volume inferior a 2 m³\nc) inclui os blocos de rocha de volume superior a 5 m³\nd) inclui os solos em geral com diâmetro máximo de 0,15 m',
        options: ['a) exige emprego contínuo de explosivos', 'b) inclui blocos de rocha de volume inferior a 2 m³', 'c) inclui blocos de volume superior a 5 m³', 'd) inclui solos com diâmetro máximo de 0,15 m'],
        gabarito: 'Alternativa B (blocos de rocha de volume inferior a 2 m³)',
        solution: 'Materiais de 2ª categoria incluem blocos com volume menor que 2 m³ e diâmetro médio entre 0,15 m e 1,0 m.'
      },
      {
        banca: 'COMPESA',
        prompt: 'Corte com cota do terreno natural = 120,50 m e cota do greide = 116,00 m. Declividade do talude 3 (vertical) : 2 (horizontal). A largura da base do talude de corte vale:\na) 2,00 m\nb) 2,50 m\nc) 3,00 m\nd) 3,50 m',
        options: ['a) 2,00 m', 'b) 2,50 m', 'c) 3,00 m', 'd) 3,50 m'],
        gabarito: 'Alternativa C (3,00 m)',
        solution: 'Altura do corte h = 120,50 − 116,00 = 4,50 m. Por semelhança: 3 / 2 = 4,50 / x → 3x = 9 → x = 3,00 m.'
      }
    ],
    caution: 'Operações com explosivos (3ª categoria) só podem ocorrer durante o dia em horários fixos e com isolamento total e vigias.'
  },

  // ESTRUTURAS
  'O método dos binários de extremidade': {
    intro: 'O método dos binários decompõe o elemento estrutural em corpo livre isolado, equilibrando momentos de extremidade e cargas no vão.',
    formulas: 'Diferença de Momentos: ΔM = M_final − M_inicial\nBinário de Cisalhamento: V_bin = ΔM / L\nCortante por Superposição: V(x) = V0(x) + V_bin\nMomento Fletor: M(x) = M0(x) + M_inicial + (ΔM / L) · x\nSeção Crítica: V(x) = 0 → x_crítico = V(0) / q',
    sections: [
      { title: 'Princípio Físico do Binário', text: 'Ao isolar uma barra entre nós A e B, se houver flexão diferente nas duas pontas (MA ≠ MB), a barra sofrerá uma tendência de rotação líquida ΔM. Para haver equilíbrio estático de rotação (ΣM = 0), as duas extremidades desenvolvem forças cortantes iguais e opostas separadas pela distância L, formando um binário cujo momento equilibra ΔM: V_bin · L = ΔM.' },
      { title: 'Superposição com a Parcela Isostática', text: 'Se a barra possui cargas distribuídas transversais (q), calcula-se primeiro o comportamento da viga biapoiada simples (V0 e M0 = qL²/8). O resultado final é a superposição direta do diagrama isostático simples com a linha inclinada gerada pelo binário das extremidades.' }
    ],
    stepByStep: [
      { title: '1. Obtenha os momentos nos nós', text: 'Identifique M_ini e M_fim nas extremidades da barra.' },
      { title: '2. Calcule o binário transversal', text: 'V_bin = (M_fim − M_ini) / L.' },
      { title: '3. Calcule o cortante inicial e final', text: 'V_ini = V0_ini + V_bin e V_fim = V0_fim + V_bin.' },
      { title: '4. Localize o momento máximo', text: 'Onde V(x) = 0, calcule M_máx através da integral do cortante ou equação do momento.' }
    ],
    example: {
      title: 'Pórtico Simples com Carga Horizontal no Topo',
      text: 'Pilar AB vertical de altura L = 3 m submetido a força horizontal de 10 kN no topo B:\n1) Momento no topo B: M_B = 10 kN × 3 m = 30 kN·m.\n2) A viga BC horizontal (L = 3 m) conectada rigidamente em B recebe o mesmo momento M_B = 30 kN·m na ponta esquerda e M_C = 0 no apoio simples.\n3) Binário na viga BC: V_bin = (0 − 30) / 3 = −10 kN.\n4) As reações verticais resultantes nos apoios surgem exatamente do binário: R_Cy = +10 kN e R_Ay = −10 kN.'
    },
    questions: [
      {
        banca: 'Concurso Eletrobras / Engenharia Civil',
        prompt: 'Em uma barra de pórtico plano de comprimento 4 m sem cargas intermediárias, os momentos fletores nas extremidades são M_A = 20 kN·m e M_B = 60 kN·m. O esforço cortante ao longo da barra vale:\na) 5 kN\nb) 10 kN\nc) 15 kN\nd) 20 kN',
        options: ['a) 5 kN', 'b) 10 kN', 'c) 15 kN', 'd) 20 kN'],
        gabarito: 'Alternativa B (10 kN)',
        solution: 'Como não há carga no vão (q = 0), o cortante decorre exclusivamente do binário de momentos: V = (M_B − M_A) / L = (60 − 20) / 4 = 40 / 4 = 10 kN (constante ao longo de toda a barra).'
      }
    ],
    caution: 'Em rótulas internas, o momento de extremidade é sempre nulo (M = 0), anulando qualquer transferência de flexão entre as barras.'
  },

  // MUROS DE CONTENÇÃO
  'Critérios de estabilidade e NBR 11682': {
    intro: 'Os muros de contenção devem satisfazer rigorosos fatores de segurança geotécnicos e estruturais.',
    formulas: 'Fatores de Segurança Mínimos (NBR 11682):\n• Tombamento: FS_tomb = M_estabilizante / M_tombamento ≥ 2,0\n• Deslizamento na base: FS_desl = ΣV · tg(δ) / ΣH ≥ 1,5\n• Capacidade de carga da fundação: FS_solo ≥ 3,0\n• Excentricidade da resultante: e ≤ B / 6 (terço central)',
    sections: [
      { title: 'Verificação ao Tombamento e Deslizamento', text: 'O empuxo lateral de terra e da água gera momento de tombamento em torno da ponta inferior do muro (pé). O peso próprio do muro (e do solo sobre o talão, em muros de flexão) gera o momento estabilizante. Para deslizamento, a resistência por atrito na base deve superar as forças horizontais com margem de 50% (FS ≥ 1,5).' }
    ],
    questions: [
      {
        banca: 'VUNESP - SAAE Barretos',
        prompt: 'Para um projeto de estabilização de encostas com muros de arrimo (gravidade e flexão), os fatores de segurança mínimos para tombamento e deslizamento na base são respectivamente:\na) 2,5 e 2,0\nb) 2,0 e 1,5\nc) 1,8 e 1,5\nd) 1,5 e 3,0',
        options: ['a) 2,5 e 2,0', 'b) 2,0 e 1,5', 'c) 1,8 e 1,5', 'd) 1,5 e 3,0'],
        gabarito: 'Alternativa B (2,0 e 1,5)',
        solution: 'Conforme a NBR 11682, o fator mínimo contra tombamento é 2,0 e contra deslizamento na base é 1,5.'
      },
      {
        banca: 'FCC - ARTESP',
        prompt: 'Para a verificação da segurança ao deslizamento na base de muros de contenção, deve ser atendido o fator de segurança mínimo de:\na) 1,25\nb) 1,20\nc) 2,50\nd) 2,00\ne) 1,50',
        options: ['a) 1,25', 'b) 1,20', 'c) 2,50', 'd) 2,00', 'e) 1,50'],
        gabarito: 'Alternativa E (1,50)',
        solution: 'O coeficiente de segurança contra deslizamento na base é de 1,50.'
      }
    ],
    caution: 'A ausência de dreno eficiente gera acúmulo de pressão hidrostática, que pode dobrar o empuxo atuante e causar colapso imediato da contenção.'
  }
};
