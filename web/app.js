import { calculateFrame } from './calculator.js';
import { createDemoModel, readCalculationModel, renderCalculationView } from './calculation-view.js';
import { FtoolCanvasApp } from './ftool-canvas.js';

const icons = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  structure: '<path d="M4 20h16M6 20V8h12v12M3 8h18M8 8V4h8v4M9 12v2m6-2v2"/>',
  ruler: '<path d="M4 20 20 4M7 17l-2-2m5-1-2-2m5-1-2-2m5-1-2-2"/>',
  mountain: '<path d="m3 19 6-10 4 6 3-4 5 8zM9 9l2-4 3 4"/>',
  wall: '<path d="M4 20V5l8-2 8 2v15M4 9h16M4 14h16M8 9v5m8-5v5m-4 0v6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5zM4 16h16M8 7h8m-8 4h6"/>',
  water: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11zM9 15a3 3 0 0 0 3 3"/>',
  budget: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5c-.7-.8-1.8-1.2-3.1-1.2-1.8 0-3 .8-3 2s1.1 1.8 3 2.2c1.8.4 3 .9 3 2.2s-1.2 2.2-3.2 2.2c-1.4 0-2.6-.5-3.3-1.4M12 5.5v13"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 4.5 4.5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="m15 18-6-6 6-6M9 12h11"/>',
  pencil: '<path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM14 7l3 3"/>',
  line: '<path d="M5 19 19 5"/>',
  eraser: '<path d="m7 16-3-3a2 2 0 0 1 0-3l6-6a2 2 0 0 1 3 0l7 7a2 2 0 0 1 0 3l-3 3H8a2 2 0 0 1-1-1zM10 7l7 7m-9 4 6-6"/>',
  undo: '<path d="M9 14 4 9l5-5M4 9h9a6 6 0 0 1 0 12h-2"/>',
  redo: '<path d="m15 14 5-5-5-5m5 5h-9a6 6 0 0 0 0 12h2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 20h14"/>',
  camera: '<path d="M4 7h3l1.5-2h7L17 7h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  document: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7m-7 4h7"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
};

const categories = [
  { id: 'estruturas', name: 'Estruturas', icon: 'structure', count: '12 conteúdos' },
  { id: 'topografia', name: 'Topografia', icon: 'ruler', count: '8 conteúdos' },
  { id: 'terraplenagem', name: 'Terraplenagem', icon: 'mountain', count: '6 conteúdos' },
  { id: 'muros', name: 'Muros de contenção', icon: 'wall', count: '7 conteúdos' },
  { id: 'normas', name: 'NBRs e DNIT', icon: 'book', count: '10 referências' },
  { id: 'hidraulica', name: 'Hidráulica', icon: 'water', count: 'Em breve' },
  { id: 'solos', name: 'Solos', icon: 'mountain', count: 'Em breve' },
  { id: 'orcamento', name: 'Orçamento', icon: 'budget', count: 'Em breve' },
];

const content = {
  topografia: [
    ['Topografia, topometria e topologia', 'Conceitos do levantamento, medidas planimétricas e altimétricas e representação da forma do terreno.', ['Planimetria', 'Altimetria']],
    ['Coordenadas e projeção UTM', 'Coordenadas geodésicas e planas, fusos de 6° e leitura de coordenadas no sistema UTM.', ['Datum', 'Fusos']],
    ['Instrumentos de campo', 'Teodolito, nível, estação total e acessórios: para que servem e como escolher o método.', ['Estação total', 'Nível']],
    ['Poligonais e fechamento', 'Azimutes, rumos, coordenadas parciais e totais, erro angular e erro linear de fechamento.', ['Azimute', 'Precisão']],
    ['Nivelamento', 'Cálculo de desníveis com leituras de ré e vante no nivelamento geométrico e trigonométrico.', ['Cotas', 'Desníveis']],
    ['Curvas de nível e relevo', 'Interpretação de talvegues, espigões, divisores de água e curvas de nível.', ['Relevo', 'Perfis']],
  ],
  terraplenagem: [
    ['Corte, aterro e compensação', 'Volumes escavados e compactados, áreas de empréstimo e destinação de material excedente.', ['Corte', 'Aterro']],
    ['Empolamento e contração', 'A conversão entre volume no corte, volume solto e volume após compactação depende do material.', ['Volume', 'Índices']],
    ['Diagrama de Bruckner', 'Diagrama de massas para visualizar compensações longitudinais e apoiar a escolha de transporte.', ['DMT', 'Transporte']],
    ['Serviços preliminares', 'Limpeza da faixa, desmatamento, destocamento e leitura da cota vermelha.', ['Implantação', 'Cotas']],
    ['Classificação de materiais', 'Categorias de escavação conforme os equipamentos e critérios definidos para a obra.', ['1ª categoria', 'DNIT']],
    ['Execução e controle de aterros', 'Camadas, umidade e grau de compactação devem seguir projeto, ensaios e especificação contratual.', ['NBR 5681', 'Controle']],
  ],
  muros: [
    ['Sistemas de contenção', 'Diferenças entre soluções rígidas e flexíveis, condições de aplicação e limitações.', ['Concepção', 'Solo']],
    ['Muros de gravidade', 'Pedra, concreto ciclópico e gabiões resistem principalmente pelo peso próprio.', ['Tombamento', 'Deslizamento']],
    ['Muros de flexão', 'Elementos de concreto armado em L ou T invertido e verificações de estabilidade e resistência.', ['Concreto armado', 'Fundação']],
    ['Gabiões', 'Tipos caixa, colchão e saco, suas aplicações e cuidados com drenagem e filtro.', ['Caixa', 'Colchão', 'Saco']],
    ['Estabilidade global', 'Avaliação do conjunto solo-contenção, além das verificações locais do muro.', ['NBR 11682', 'Talude']],
  ],
  estruturas: [
    ['Equilíbrio de estruturas planas', 'Graus de liberdade, vínculos, reações e identificação de estruturas isostáticas.', ['Isostática', 'Reações']],
    ['Diagramas de esforços', 'Método das seções para normal, cortante e momento fletor em vigas e pórticos.', ['N', 'V', 'M']],
    ['Nós rígidos e rótulas', 'Transferência de forças e momentos em nós rígidos; momento nulo em rótulas internas.', ['Pórticos', 'Gerber']],
    ['Cargas distribuídas', 'Resultante e ponto de aplicação; relação entre carregamento, cortante e momento.', ['q(x)', 'Diagramas']],
  ],
  normas: [
    ['ABNT NBR 13133', 'Execução de levantamentos topográficos: métodos, procedimentos, precisão e apresentação.', ['Topografia', 'ABNT']],
    ['ABNT NBR 5681', 'Controle tecnológico da execução de aterros em obras de edificações; consulte a edição vigente e as especificações do projeto.', ['Aterros', 'Controle']],
    ['Especificações DNIT', 'Critérios de execução e controle de serviços rodoviários devem ser conferidos na especificação aplicável ao contrato.', ['Rodovias', 'Obras']],
    ['ABNT NBR 11682', 'Estabilidade de encostas e taludes; pode ser relevante para estabilidade global de contenções.', ['Taludes', 'Estabilidade']],
  ],
  hidraulica: [], solos: [], orcamento: [],
};

const topographyDetails = [
  [
    { kind: 'teoria', title: 'Topografia, topometria e topologia', text: 'Topografia representa uma porção limitada da superfície terrestre para fins de projeto, tratando a área como plana dentro das aproximações do levantamento. Topometria reúne os métodos de medição: planimetria determina posições horizontais e altimetria determina cotas e desníveis. Topologia descreve a forma do relevo e as relações entre suas feições.' },
    { kind: 'teoria', title: 'Planimetria e altimetria', text: 'Planimetria trabalha com coordenadas horizontais (E, N ou X, Y). Altimetria trabalha com cotas e diferenças de nível. Um levantamento planialtimétrico combina as duas componentes para representar posição e relevo.' },
    { kind: 'calculo', title: 'Exemplo: desnível entre dois pontos', text: 'Se A tem cota 100,00 m e o desnível medido de A para B é +1,35 m, então cota(B) = cota(A) + Δh = 100,00 + 1,35 = 101,35 m.' },
  ],
  [
    { kind: 'teoria', title: 'Coordenadas geodésicas e UTM', text: 'Coordenadas geodésicas expressam latitude e longitude sobre um datum. UTM é uma projeção plana dividida em 60 fusos de 6° de longitude; as coordenadas são expressas como Este (E) e Norte (N). Registre sempre o datum e o fuso para evitar incompatibilidades entre levantamentos.' },
    { kind: 'calculo', title: 'Identifique o fuso UTM', text: 'O fuso pode ser estimado pela longitude λ em graus: fuso = piso((λ + 180°) / 6°) + 1. Depois confira o datum e a zona hemisférica no sistema cartográfico adotado.' },
  ],
  [
    { kind: 'teoria', title: 'Escolha do instrumento', text: 'O nível é usado principalmente para determinar diferenças de cotas; o teodolito mede ângulos horizontais e verticais; a estação total combina medidas angulares e distâncias para obter coordenadas. Tripé, prisma, mira, bastão e balizas auxiliam a operação.' },
    { kind: 'teoria', title: 'Cuidados de campo', text: 'Centralize e nivele o instrumento, confira a constante/prisma quando aplicável, identifique os pontos e registre alturas do instrumento e do prisma. A precisão requerida pelo trabalho deve orientar instrumento, método e controle.' },
  ],
  [
    { kind: 'teoria', title: 'Azimute, rumo e poligonal', text: 'Azimute é medido a partir do Norte, no sentido horário, de 0° a 360°. Rumo é o menor ângulo entre a direção e o eixo Norte-Sul, acompanhado do quadrante. Em uma poligonal, propague as direções e confira o fechamento angular antes de ajustar coordenadas.' },
    { kind: 'calculo', title: 'Coordenadas parciais', text: 'Para distância d e azimute Az medido desde o Norte: ΔE = d · sen(Az) e ΔN = d · cos(Az). Exemplo: d = 100 m e Az = 60° → ΔE = 86,60 m e ΔN = 50,00 m. Some as parciais às coordenadas do ponto anterior.' },
    { kind: 'calculo', title: 'Erro de fechamento linear', text: 'Após percorrer a poligonal, calcule fE = ΣΔE e fN = ΣΔN. O erro linear é f = √(fE² + fN²). Compare a precisão relativa perímetro/f com o limite especificado para a classe do levantamento antes de distribuir correções.' },
    { kind: 'calculo', title: 'Erro angular', text: 'Calcule o erro angular como a diferença entre a soma observada e a soma teórica dos ângulos, conforme a convenção da poligonal. Em um circuito de ângulos internos, a soma teórica é (n − 2) · 180°. A tolerância depende do método e da classe de precisão.' },
  ],
  [
    { kind: 'teoria', title: 'Ré, vante e mudança de estação', text: 'Ré é a leitura feita para um ponto de cota conhecida ou de referência. Vante é a leitura para determinar a cota do próximo ponto. Em ponto de mudança, a leitura de vante encerra uma estação e a leitura de ré inicia a seguinte.' },
    { kind: 'calculo', title: 'Método da altura do instrumento', text: 'Altura do instrumento (AI) = cota conhecida + leitura de ré. Cota do ponto visado = AI − leitura de vante. Exemplo: cota A = 100,00 m; ré = 1,42 m; vante = 2,05 m → AI = 101,42 m e cota B = 99,37 m; logo Δh(A→B) = −0,63 m.' },
    { kind: 'calculo', title: 'Nivelamento trigonométrico', text: 'O desnível pode ser obtido a partir da distância inclinada ou horizontal e do ângulo vertical, considerando altura do instrumento e altura do alvo/prisma. Declare a convenção angular e a referência de distância usada; valide com visadas recíprocas quando aplicável.' },
  ],
  [
    { kind: 'teoria', title: 'Como interpretar curvas de nível', text: 'Cada curva liga pontos de mesma cota. Curvas próximas indicam maior declividade; curvas afastadas indicam terreno mais suave. Curvas não se cruzam em uma representação topográfica usual e devem ser lidas junto com a equidistância vertical.' },
    { kind: 'teoria', title: 'Talvegues e espigões', text: 'Talvegue acompanha a linha mais baixa do vale e tende a apontar para cotas crescentes a montante. Espigão ou divisor de águas acompanha uma linha elevada, separando bacias. A curvatura das curvas de nível ajuda a reconhecer essas feições.' },
    { kind: 'calculo', title: 'Interpolação de cota', text: 'Entre duas curvas de cotas conhecidas, estime a cota de um ponto por interpolação proporcional à distância, quando o terreno puder ser aproximado como uniforme nesse trecho. Não extrapole além das curvas sem justificar a hipótese.' },
  ],
];

const summaryExtras = {
  terraplenagem: [
    [{ kind: 'teoria', title: 'Corte, aterro e compensação', text: 'Corte remove material acima da plataforma de projeto; aterro deposita e compacta material abaixo dela. Empréstimo complementa volume disponível; bota-fora recebe excedente ou material inadequado. Compare volumes no mesmo estado físico.' }, { kind: 'calculo', title: 'Volume entre seções', text: 'Pelo método das áreas médias, V ≈ (A₁ + A₂) · L/2. Exemplo: áreas 12 m² e 20 m², afastadas 10 m → V ≈ 160 m³. Para terreno muito variável, avalie o método prismoidal e a subdivisão das seções.' }],
    [{ kind: 'teoria', title: 'Empolamento e contração', text: 'Empolamento é o aumento de volume após escavação; contração é a redução de volume entre o material solto e o aterro compactado. Não use um fator universal: obtenha os índices para o material da obra.' }, { kind: 'calculo', title: 'Balanço de volumes', text: 'Converta volumes para o mesmo estado (corte, solto ou compactado) antes de comparar corte, aterro, empréstimo e bota-fora. O fator de conversão adotado deve estar explícito.' }],
    [{ kind: 'teoria', title: 'Diagrama de Bruckner e DMT', text: 'O diagrama de massas representa o volume acumulado ao longo do eixo da obra. Trechos ascendentes e descendentes indicam produção e consumo de material; as áreas e distâncias entre ordenadas ajudam a planejar transporte e compensação.' }, { kind: 'calculo', title: 'Distância média de transporte', text: 'Para volumes discretizados, DMT = Σ(Vi · di) / ΣVi, onde Vi é o volume transportado no trecho e di sua distância média. Exemplo: 100 m³ transportados 40 m e 200 m³ transportados 70 m → DMT = (100·40 + 200·70)/300 = 60 m.' }],
    [{ kind: 'teoria', title: 'Serviços preliminares e cota vermelha', text: 'Antes do movimento de terra, delimite a obra, faça limpeza, desmatamento e destocamento conforme autorização e projeto. A cota vermelha é a diferença entre a cota de projeto e a cota do terreno natural; o sinal indica corte ou aterro conforme a convenção adotada.' }],
    [{ kind: 'teoria', title: 'Categorias de escavação', text: 'As categorias descrevem a dificuldade de escavação e os meios de produção previstos: materiais escaváveis com equipamentos usuais, materiais que requerem meios especiais e rocha que pode exigir rompimento. A classificação efetiva segue a especificação contratual, não apenas o nome visual do solo.' }],
    [{ kind: 'teoria', title: 'Execução e controle tecnológico', text: 'Aterros são executados em camadas, com material caracterizado, umidade controlada e compactação verificada por ensaios. Controle inclui origem, espessura solta, equipamento, número de passadas, densidade in situ e registros por lote.' }, { kind: 'calculo', title: 'Grau de compactação', text: 'GC = γd,campo / γd,máx · 100%. Se γd,campo = 1,93 Mg/m³ e γd,máx = 2,00 Mg/m³, GC = 96,5%. A aceitação depende do valor de projeto/especificação, da energia de ensaio e da camada considerada.' }],
  ],
  muros: [
    [{ kind: 'teoria', title: 'Contenções rígidas e flexíveis', text: 'Muros de gravidade resistem principalmente pelo peso próprio; muros de flexão mobilizam a seção de concreto armado. Sistemas flexíveis, como gabiões, acomodam deformações maiores. A escolha depende de geometria, solo, água, espaço e execução.' }, { kind: 'verificacao', title: 'Verificações de estabilidade', text: 'Avalie deslizamento, tombamento, tensões/capacidade de suporte e estabilidade global, além da resistência estrutural e drenagem. Os fatores de segurança e combinações devem vir das normas e critérios aplicáveis ao projeto.' }],
    [{ kind: 'teoria', title: 'Muros de gravidade', text: 'Muros de pedra, concreto ciclópico e gabiões usam massa e geometria para equilibrar empuxos. Drenagem e filtro reduzem pressões de água e perda de finos.' }, { kind: 'calculo', title: 'Equilíbrio de momentos', text: 'Para uma seção de muro, some momentos estabilizantes e solicitantes em relação ao pé. O fator de segurança ao tombamento depende da definição normativa e das combinações de ações; não se adote um valor genérico sem conferir o projeto.' }],
    [{ kind: 'teoria', title: 'Muros de flexão', text: 'Seções em L ou T invertido têm fuste e base trabalhando em flexão. Considere empuxos, sobrecargas, água, peso próprio e interação com o solo; dimensionamento estrutural e estabilidade geotécnica são verificações distintas.' }],
    [{ kind: 'teoria', title: 'Gabiões: caixa, colchão e saco', text: 'Gabiões caixa formam volumes de contenção; colchões são elementos baixos e extensos para proteção superficial e hidráulica; gabiões saco são elementos cilíndricos usados em situações de instalação específica. Selecione malha, pedra, filtro e proteção conforme exposição e projeto.' }],
    [{ kind: 'norma', title: 'Estabilidade global e NBR 11682', text: 'A NBR 11682 aborda estabilidade de encostas e taludes e pode ser relevante para a análise global do conjunto solo-contenção. Ela não substitui as verificações estruturais específicas do muro nem os demais critérios geotécnicos aplicáveis.' }],
  ],
  estruturas: [
    [{ kind: 'teoria', title: 'Graus de liberdade e vínculos', text: 'Um corpo rígido plano possui duas translações e uma rotação. Apoios e ligações restringem graus de liberdade; a contagem ajuda a avaliar estaticidade, mas a eficácia geométrica dos vínculos também precisa ser examinada.' }, { kind: 'calculo', title: 'Equilíbrio global', text: 'Para uma estrutura plana em equilíbrio: ΣFx = 0, ΣFy = 0 e ΣMp = 0. Substitua cargas distribuídas por resultantes apenas no cálculo global; para diagramas, preserve a variação ao longo da barra.' }],
    [{ kind: 'teoria', title: 'Leitura dos diagramas N, V e M', text: 'Normal N atua paralelo à barra; cortante V atua perpendicularmente; momento fletor M representa a resultante interna de flexão. N positivo indica tração; o sinal de V segue a convenção de giro horário; em vigas, M positivo traciona a face inferior.' }, { kind: 'calculo', title: 'Método das seções', text: 'Faça um corte na posição x, isole um dos lados e escreva equilíbrio de forças e momentos. Carga pontual provoca salto em V; carga uniformemente distribuída faz V variar linearmente e M variar quadraticamente.' }],
    [{ kind: 'teoria', title: 'Nó rígido e rótula', text: 'No nó rígido as barras compartilham translações e rotação e transferem momentos. A rótula transmite forças, permite giro relativo e impõe M = 0 nas extremidades conectadas.' }, { kind: 'calculo', title: 'Binário de transferência', text: 'No nó rígido, ΣM_nó = 0. O momento de extremidade de uma barra equilibra os momentos das demais barras e ações nodais. Em uma rótula, não se transfere binário: cada momento de extremidade no nó vale zero.' }],
    [{ kind: 'calculo', title: 'Carga distribuída uniforme', text: 'Para q constante em um trecho: dV/dx = −q e dM/dx = V. Portanto, V é linear e M é uma parábola de segundo grau. O máximo ou mínimo de M ocorre onde V = 0, dentro do trecho.' }],
  ],
  normas: [
    [{ kind: 'norma', title: 'Aplicação no levantamento', text: 'Use a edição vigente da NBR 13133 e a classe de precisão exigida. Defina datum, sistema de coordenadas, procedimentos de campo, controle e apresentação dos resultados.' }],
    [{ kind: 'norma', title: 'Controle tecnológico de aterros', text: 'Consulte a edição vigente da NBR 5681, o projeto geotécnico e a especificação do contrato. Espessura de camada, faixa de umidade e grau de compactação não devem ser presumidos fora desses documentos.' }],
    [{ kind: 'norma', title: 'Especificações rodoviárias', text: 'As especificações DNIT variam conforme o serviço e a edição. Confira o código e a revisão citados no contrato, inclusive métodos de ensaio e critérios de aceitação.' }],
    [{ kind: 'norma', title: 'Escopo da NBR 11682', text: 'A norma trata de estabilidade de encostas e taludes. Pode embasar a estabilidade global relacionada a uma contenção, mas não é isoladamente uma norma completa de dimensionamento estrutural de muros.' }],
  ],
};

const fullLessons = {
  'Coordenadas parciais': {
    intro: 'A projeção de uma distância no plano depende da direção da linha. Nesta página, o azimute é contado no sentido horário a partir do Norte e as coordenadas são Este (E) e Norte (N).',
    sections: [
      { title: 'Equações de projeção', text: 'ΔE = d · sen(Az) e ΔN = d · cos(Az). As coordenadas do ponto seguinte são E₂ = E₁ + ΔE e N₂ = N₁ + ΔN. Os sinais surgem naturalmente pelo quadrante do azimute.' },
      { title: 'Exemplo resolvido', text: 'Considere d = 100 m e Az = 60°. Então ΔE = 100 · sen(60°) = +86,60 m e ΔN = 100 · cos(60°) = +50,00 m. Partindo de E₁ = 500,00 m e N₁ = 1.000,00 m, obtém-se E₂ = 586,60 m e N₂ = 1.050,00 m.' },
      { title: 'Verificação de quadrante', text: 'No azimute 225°, sen e cos são negativos: a linha avança para Oeste e Sul. Antes de calcular uma poligonal, confirme se o ângulo está referido ao Norte ou ao eixo Este e mantenha a mesma convenção em todas as linhas.' },
    ],
    caution: 'Confira datum, fuso UTM, unidade angular e precisão do levantamento antes de usar as coordenadas em locação.',
  },
  'Erro de fechamento linear': {
    intro: 'Em uma poligonal fechada, a soma ideal dos deslocamentos horizontais deve retornar ao ponto inicial. Diferenças residuais indicam erro de fechamento e precisam ser avaliadas antes do ajuste.',
    sections: [
      { title: 'Componentes do erro', text: 'Some separadamente todas as projeções: fE = ΣΔE e fN = ΣΔN. O erro linear resultante é f = √(fE² + fN²). A precisão relativa pode ser expressa por perímetro/f.' },
      { title: 'Exemplo resolvido', text: 'Se fE = +0,04 m e fN = −0,03 m, então f = √(0,04² + 0,03²) = 0,05 m. Para perímetro de 500 m, a razão é 500/0,05 = 10.000, ou fechamento 1:10.000.' },
      { title: 'Ajuste e controle', text: 'Compare primeiro o fechamento com a tolerância estabelecida para a classe do levantamento. Se aceitável, distribua as correções pelo método prescrito, como Bowditch quando apropriado, e recalcule as coordenadas ajustadas.' },
    ],
    caution: 'Um ajuste matemático não torna aceitável um levantamento que excedeu o limite de precisão do método ou da especificação.',
  },
  'Erro angular': {
    intro: 'O fechamento angular verifica se os ângulos observados de uma poligonal são compatíveis com a geometria teórica e com a convenção adotada.',
    sections: [
      { title: 'Soma teórica de ângulos internos', text: 'Para n vértices de um polígono simples, a soma teórica dos ângulos internos é βₜ = (n − 2) · 180°. O erro angular é fβ = Σβobservado − βₜ.' },
      { title: 'Exemplo resolvido', text: 'Em um quadrilátero, βₜ = (4 − 2) · 180° = 360°. Se a soma observada for 360°00′20″, o erro angular é +20″. Distribuir esse erro entre os ângulos só é adequado se o fechamento estiver dentro da tolerância especificada.' },
      { title: 'Propagação de azimutes', text: 'Depois da compensação angular, calcule os azimutes sucessivos usando a deflexão ou o ângulo interno correspondente. Reduza o resultado ao intervalo de 0° a 360° e confira o fechamento na direção inicial.' },
    ],
    caution: 'A tolerância angular depende do método, do equipamento, do número de estações e da classe exigida.',
  },
  'Método da altura do instrumento': {
    intro: 'No nivelamento geométrico, a leitura de ré estabelece a altura do plano de colimação; a leitura de vante determina a cota do ponto visado.',
    sections: [
      { title: 'Equações de cota', text: 'AI = cota conhecida + ré. Para cada ponto visado, cota = AI − vante. Em uma estação, o desnível entre ré e vante é Δh = ré − vante.' },
      { title: 'Exemplo resolvido', text: 'Cota A = 100,000 m, ré em A = 1,420 m: AI = 101,420 m. Vante em B = 2,050 m: cota B = 101,420 − 2,050 = 99,370 m. Portanto, Δh(A→B) = −0,630 m.' },
      { title: 'Ponto de mudança', text: 'Registre a vante no ponto de mudança antes de deslocar o nível; após instalar o instrumento, leia ré no mesmo ponto. Some as variações de nível ou confira a diferença entre a soma das rés e a soma das ventes.' },
    ],
    caution: 'Distribua e avalie o erro de nivelamento conforme o percurso, as visadas e a tolerância de projeto.',
  },
  'Azimute, rumo e poligonal': {
    intro: 'A orientação de cada alinhamento liga os pontos levantados e permite calcular coordenadas. Azimute e rumo descrevem a mesma direção com convenções angulares diferentes.',
    sections: [
      { title: 'Azimute', text: 'Azimute é contado no sentido horário a partir do Norte, variando de 0° a 360°. Por exemplo, 90° aponta para Leste e 180° para Sul.' },
      { title: 'Rumo', text: 'Rumo é o ângulo agudo entre a direção e o eixo Norte-Sul, acompanhado do quadrante: NE, SE, SW ou NW. Converta o quadrante em sinais de ΔE e ΔN antes de projetar as distâncias.' },
      { title: 'Roteiro de cálculo', text: 'Confira os ângulos observados; compense o fechamento angular dentro da tolerância; calcule azimutes; projete cada distância em ΔE e ΔN; some as coordenadas parciais; por fim, verifique o fechamento linear.' },
    ],
    caution: 'Anote claramente a origem angular (Norte ou Leste), o sentido de giro e o datum das coordenadas.',
  },
  'Nivelamento trigonométrico': {
    intro: 'O nivelamento trigonométrico calcula desníveis a partir de distâncias e ângulos verticais, sendo útil quando o método geométrico é difícil ou inviável.',
    sections: [
      { title: 'Dados necessários', text: 'Registre cota da estação, altura do instrumento, altura do prisma/alvo, distância usada e ângulo vertical com sua convenção. Distância inclinada e distância horizontal exigem relações trigonométricas diferentes.' },
      { title: 'Relação básica', text: 'Se o ângulo α é medido a partir da horizontal e a distância horizontal é Dh, a componente vertical entre os eixos instrumentais é Δz = Dh · tan(α). A diferença de cotas dos pontos inclui ainda altura do instrumento e altura do alvo.' },
      { title: 'Controle', text: 'Use observações recíprocas ou pontos de controle quando possível. Compare o resultado com tolerâncias e procedimentos definidos para o levantamento.' },
    ],
    caution: 'Não misture ângulo zenital e ângulo vertical sem converter a convenção; isso inverte ou altera o desnível.',
  },
  'Corte, aterro e compensação': {
    intro: 'Terraplenagem adapta o terreno natural às cotas de projeto. O planejamento precisa conhecer volumes, qualidade dos materiais e distâncias de transporte.',
    sections: [
      { title: 'Conceitos de obra', text: 'Corte é a escavação acima da superfície projetada; aterro é a execução abaixo dela. Material de empréstimo vem de uma área externa autorizada. Bota-fora é o destino do material excedente ou inadequado, definido pelo projeto e licenciamento.' },
      { title: 'Volume entre seções', text: 'Uma estimativa comum é V = (A₁ + A₂)·L/2, com áreas transversais A₁ e A₂ separadas pela distância L. Para variação suave, o método prismoidal pode reduzir a aproximação: V = L·(A₁ + 4Am + A₂)/6.' },
      { title: 'Exemplo resolvido', text: 'Duas seções têm áreas de corte 12 m² e 20 m², separadas por 10 m. Pela média das áreas: V = (12 + 20)·10/2 = 160 m³ no estado de medição usado. Repita trecho a trecho e não some corte e aterro sem verificar a compatibilidade dos materiais.' },
    ],
    caution: 'Registre se o volume está no corte, solto ou compactado; os estados não são intercambiáveis.',
  },
  'Empolamento e contração': {
    intro: 'A escavação desagrega o solo e altera seu volume aparente. A compactação reduz vazios e produz outro estado volumétrico; por isso, os fatores devem ser medidos ou especificados para o material real.',
    sections: [
      { title: 'Definições e convenções', text: 'Uma convenção para empolamento é e = (Vsolto/Vnatural − 1)·100%. Uma convenção para contração é c = (Vnatural − Vcompactado)/Vnatural·100%. A literatura e contratos podem usar razões inversas; escreva sempre a definição adotada.' },
      { title: 'Exemplo de empolamento', text: 'Se 100 m³ medidos no corte produzem e = 25% no estado solto, Vsolto = 100·(1 + 0,25) = 125 m³. Esse volume transportado ocupa mais espaço, mas não representa material adicional.' },
      { title: 'Exemplo de contração', text: 'Se a convenção c = 15% e Vnatural = 100 m³, então Vcompactado = 100·(1 − 0,15) = 85 m³. Para estimar aterro, use o fator de conversão obtido por ensaio e controle de campo.' },
    ],
    caution: 'Não adote fatores genéricos sem caracterização; granulometria, umidade, energia e método de medição alteram os resultados.',
  },
  'Diagrama de Bruckner': {
    intro: 'O diagrama de massas acumula volumes de corte e aterro ao longo do eixo longitudinal. Ele ajuda a identificar trechos de compensação e planejar transporte, empréstimo e bota-fora.',
    sections: [
      { title: 'Leitura do diagrama', text: 'Ordenadas representam volume acumulado e abscissas representam estacas/distâncias. Trechos em que a massa acumulada cresce ou decresce indicam a convenção de corte/aterro escolhida. Uma linha de compensação permite identificar volumes equilibrados.' },
      { title: 'Distância média de transporte', text: 'DMT = Σ(Vi·di)/ΣVi. Para parcelas de 100 m³ a 40 m e 200 m³ a 70 m, DMT = (4.000 + 14.000)/300 = 60 m.' },
      { title: 'Roteiro de planejamento', text: 'Calcule volumes por trecho, aplique fatores de conversão apropriados, acumule as massas, marque linhas de compensação e identifique trechos com saldo. Depois avalie acessos, sentido de transporte, distância e restrições de material.' },
    ],
    caution: 'Convenções de sinal e medição do diagrama devem ser mantidas consistentes com o projeto rodoviário.',
  },
  'Serviços preliminares': {
    intro: 'A preparação da área reduz interferências e permite executar o movimento de terra nas condições previstas em projeto e licenciamento.',
    sections: [
      { title: 'Limpeza, desmatamento e destocamento', text: 'Delimite previamente a faixa, identifique redes e áreas protegidas e remova vegetação e raízes apenas nos limites autorizados. Faça destocamento e destinação do material conforme plano ambiental e especificação.' },
      { title: 'Locação e cotas', text: 'Implante referências planialtimétricas protegidas e marque eixo, offsets e cotas de projeto. Cota vermelha pode ser definida como diferença entre projeto e terreno natural; declare o sinal adotado para que positivo/negativo identifique corte ou aterro sem ambiguidade.' },
      { title: 'Conferência de campo', text: 'Compare seções levantadas com o terreno observado, confirme drenagem provisória e registre alterações antes de escavar ou lançar material.' },
    ],
    caution: 'A autorização ambiental e as interferências subterrâneas precisam ser verificadas antes de desmatar ou escavar.',
  },
  'Classificação de materiais': {
    intro: 'A categoria de escavação influencia equipamentos, produtividade, custo e medição. A classificação contratual precisa estar associada aos critérios de campo e à especificação da obra.',
    sections: [
      { title: 'Categorias usuais', text: 'Em descrições rodoviárias, 1ª categoria reúne materiais escaváveis com equipamentos convencionais; 2ª pode exigir equipamentos ou processos de maior esforço; 3ª costuma corresponder a rocha ou material que exige desmonte. Definições precisas variam entre especificações.' },
      { title: 'Como classificar', text: 'Considere sondagens, descrição geológica, grau de alteração, fraturamento, resistência e comportamento durante a escavação. Registre evidências, equipamento empregado e limites do trecho para permitir medição auditável.' },
      { title: 'Efeito no orçamento', text: 'Separar categorias evita aplicar produtividade de solo comum a rocha ou a material que exija tratamento especial. Quantidades e preços devem seguir a planilha contratual e os critérios de medição aprovados.' },
    ],
    caution: 'Não classifique apenas pela aparência nem extrapole categorias sem validação geotécnica e contratual.',
  },
  'Execução e controle de aterros': {
    intro: 'Aterro de qualidade depende da preparação da fundação, do material apropriado, do lançamento em camadas e do controle de compactação e umidade.',
    sections: [
      { title: 'Sequência de execução', text: 'Inspecione e prepare a fundação; aprove o material; espalhe em espessura compatível com o equipamento; ajuste umidade; compacte com padrão definido; ensaie e registre antes da camada seguinte.' },
      { title: 'Grau de compactação', text: 'GC = γd,campo/γd,máx·100%. Exemplo: 1,93/2,00·100 = 96,5%. γd,máx vem do ensaio de compactação especificado. O critério mínimo e os pontos de ensaio são definidos por projeto, norma e contrato.' },
      { title: 'Umidade e espessura', text: 'Compare a umidade de campo com a umidade ótima do ensaio. Faixas como ±3 pontos percentuais só se aplicam quando estiverem explicitamente definidas pela especificação do serviço. Espessura de camada solta e compactada depende de material, equipamento e projeto.' },
      { title: 'Registro de controle', text: 'Documente lote, origem, camada, estaca, cota, equipamento, umidade, densidade, ensaio de referência e ação corretiva. Reprove ou retrabalhe pontos fora do critério antes de cobrir a camada.' },
    ],
    caution: 'A NBR 5681 e a especificação DNIT aplicável devem ser consultadas na edição contratual; não há um valor único válido para toda obra.',
  },
  'Sistemas de contenção': {
    intro: 'A contenção deve resistir às ações do solo e da água e manter estabilidade local, global e de fundação. A solução depende da geometria, espaço, deformações admissíveis, execução e drenagem.',
    sections: [
      { title: 'Rígidas e flexíveis', text: 'Sistemas rígidos limitam deformações e redistribuem esforços de modo compatível com sua rigidez. Sistemas flexíveis, como gabiões, acomodam deformações maiores e podem ser vantajosos em fundações deformáveis, desde que verificadas deformações e estabilidade.' },
      { title: 'Ações a considerar', text: 'Inclua peso próprio, empuxos, sobrecargas, nível d’água, drenagem, sismo quando aplicável e sequência construtiva. A pressão da água pode dominar a solicitação se houver drenagem inadequada.' },
      { title: 'Verificações', text: 'Separe estabilidade externa (deslizamento, tombamento, tensões de base), estabilidade global do maciço e resistência estrutural dos elementos. Verifique também deformações, drenagem, filtros e erosão.' },
    ],
    caution: 'A norma de estabilidade de taludes não substitui as normas e verificações de dimensionamento estrutural da contenção.',
  },
  'Muros de gravidade': {
    intro: 'Muros de gravidade usam peso próprio e geometria para resistir ao empuxo. Pedra argamassada, concreto ciclópico e gabiões são exemplos, com comportamento e drenagem próprios.',
    sections: [
      { title: 'Modelo de empuxo', text: 'A distribuição de pressão lateral depende do estado de deformação, propriedades do solo, geometria, sobrecarga e água. A resultante e seu ponto de aplicação devem ser coerentes com o modelo adotado e com as condições de drenagem.' },
      { title: 'Deslizamento e tombamento', text: 'Some forças horizontais e verticais para avaliar deslizamento; calcule momentos estabilizantes e solicitantes em torno do pé para avaliar tombamento. Verifique excentricidade e tensões na base conforme o critério normativo.' },
      { title: 'Capacidade de suporte e drenagem', text: 'Compare pressões na fundação com a resistência disponível e avalie recalques. Filtros, drenos e saídas de água evitam pressão hidrostática e carreamento de finos.' },
    ],
    caution: 'Fatores de segurança mínimos não são fixos entre todos os métodos e combinações; use os documentos de projeto e normas vigentes.',
  },
  'Muros de flexão': {
    intro: 'Muros em L ou T invertido trabalham como estruturas de concreto armado: fuste e base resistem à flexão e ao cisalhamento enquanto o solo sobre o talão pode contribuir para a estabilidade.',
    sections: [
      { title: 'Caminho das ações', text: 'Empuxos laterais solicitam o fuste; reações do solo e pesos próprios solicitam a base. O modelo precisa incluir sobrecargas, água, fases construtivas e excentricidade.' },
      { title: 'Verificações geotécnicas', text: 'Verifique deslizamento, tombamento, tensões de contato, capacidade de suporte e estabilidade global. A contribuição de solo sobre o talão depende da geometria e de que o solo permaneça no local.' },
      { title: 'Verificações estruturais', text: 'Dimensione fuste, talão e ponta para flexão, cisalhamento, ancoragem, fissuração e durabilidade segundo as normas de concreto e combinações aplicáveis.' },
    ],
    caution: 'A estabilidade geotécnica e o dimensionamento estrutural são análises distintas e ambas são necessárias.',
  },
  'Gabiões': {
    intro: 'Gabiões são elementos de malha preenchidos com pedras e podem formar contenções permeáveis e deformáveis. Seu desempenho depende da malha, do preenchimento, das ligações e do filtro.',
    sections: [
      { title: 'Tipos e usos', text: 'Caixas formam muros e revestimentos; colchões são baixos e extensos, usados em proteção de margens e controle de erosão; sacos são elementos cilíndricos úteis em aplicações especiais e emergenciais.' },
      { title: 'Detalhamento e execução', text: 'Escolha abertura e proteção da malha, pedra compatível, diafragmas, amarração entre unidades, filtro geotêxtil ou granular e fundação preparada. Evite perda de finos e erosão por trás da estrutura.' },
      { title: 'Verificações', text: 'Avalie deslizamento, tombamento, capacidade de suporte, estabilidade global, deformações e durabilidade da malha no ambiente de exposição.' },
    ],
    caution: 'Permeabilidade não elimina a necessidade de filtro e drenagem corretamente detalhados.',
  },
  'Estabilidade global': {
    intro: 'Uma contenção pode atender às verificações locais e ainda assim participar de uma ruptura global do talude. A análise global considera o conjunto solo, fundação e estrutura.',
    sections: [
      { title: 'Superfícies de ruptura', text: 'Analise mecanismos plausíveis de ruptura passando atrás, abaixo ou através da contenção. Investigações geotécnicas definem estratigrafia, resistência, água e parâmetros de cálculo.' },
      { title: 'NBR 11682 e escopo', text: 'A NBR 11682 trata de estabilidade de encostas e taludes e pode orientar estabilidade global quando aplicável. O dimensionamento do muro ainda requer verificações estruturais e geotécnicas próprias.' },
      { title: 'Condições de projeto', text: 'Considere drenagem obstruída, sobrecargas futuras, fases de escavação, variação do lençol e consequências da ruptura. Explique as hipóteses e combinações de ações.' },
    ],
    caution: 'Parâmetros e fatores de segurança devem vir de investigação, normas vigentes e critérios do projeto, não de valores memorizados isolados.',
  },
  'Equilíbrio de estruturas planas': {
    intro: 'A análise começa pelo modelo: geometria, vínculos, ações e conectividade. Em estruturas planas, o equilíbrio global fornece três equações independentes.',
    sections: [
      { title: 'Graus de liberdade e apoios', text: 'Um corpo rígido plano possui translação em X, translação em Y e rotação. Apoio articulado restringe duas translações; rolete restringe uma direção; engaste restringe duas translações e rotação.' },
      { title: 'Equações fundamentais', text: 'Escreva ΣFx=0, ΣFy=0 e ΣMp=0. Escolha o ponto de momentos para eliminar o maior número de incógnitas e substitua cargas distribuídas pela resultante no equilíbrio global.' },
      { title: 'Exemplo: viga biapoiada', text: 'Viga de 6 m com carga pontual de 10 kN no meio: por simetria ou momentos, RA=RB=5 kN. O momento no meio é 5·3 = 15 kN·m. Confirme ΣFy=0 e momentos em qualquer ponto.' },
      { title: 'Estabilidade do modelo', text: 'A contagem de incógnitas e equações é necessária, mas não suficiente: apoios colineares ou mal orientados podem permitir movimento de corpo rígido mesmo com contagem aparentemente correta.' },
    ],
    caution: 'Use sinais consistentes e verifique o equilíbrio global depois de determinar as reações.',
  },
  'Diagramas de esforços': {
    intro: 'Diagramas mostram a variação do esforço normal N, cortante V e momento fletor M ao longo das barras. Cada diagrama deve respeitar equilíbrio em qualquer corte.',
    sections: [
      { title: 'Convenções de sinais', text: 'Normal positivo traciona a barra. Cortante positivo causa giro horário segundo a convenção adotada. Em vigas, momento positivo traciona a face inferior e o diagrama é desenhado no lado tracionado.' },
      { title: 'Método das seções', text: 'Corte a barra na posição x, isole um dos lados e imponha ΣFx=0, ΣFy=0 e ΣM=0. Projete forças globais nos eixos locais: paralela à barra para N, perpendicular para V.' },
      { title: 'Forma dos diagramas', text: 'Sem carga distribuída, V é constante e M é linear. Sob q uniforme, dV/dx=−q e dM/dx=V: V varia linearmente e M é quadrático. Carga pontual causa salto em V; momento concentrado causa salto em M.' },
      { title: 'Ponto de máximo momento', text: 'Em um trecho contínuo, extremo local de M ocorre onde V=0. Calcule M nessa posição e compare com valores nas extremidades e descontinuidades.' },
    ],
    caution: 'Em barras inclinadas, N e V são locais. Não confunda suas componentes com Fx e Fy globais.',
  },
  'Nós rígidos e rótulas': {
    intro: 'A conectividade muda o caminho dos esforços. Nó rígido mantém a rotação relativa das barras e transmite momento; rótula mantém translações compatíveis, mas permite giro relativo.',
    sections: [
      { title: 'Equilíbrio do nó rígido', text: 'Some forças globais e momentos das extremidades: ΣFx=0, ΣFy=0, ΣMnó=0. O binário que uma barra entrega é equilibrado pelos momentos das outras barras, transferindo flexão entre viga e pilar.' },
      { title: 'Rótula interna', text: 'A rótula transmite forças horizontais e verticais, mas libera o momento: M=0 em cada extremidade conectada. O equilíbrio de momentos deve ser escrito separadamente para os corpos livres adjacentes.' },
      { title: 'Exemplo de binário', text: 'Uma força de 10 kN aplicada a 2 m do nó em um balanço gera momento de 20 kN·m no apoio. Em um nó rígido, esse binário aparece no elemento conectado; numa rótula, não é transferido como momento.' },
      { title: 'Grau de estaticidade', text: 'Para o modelo plano de barras, conte restrições externas e internas e avalie g_h. Uma contagem nula indica possibilidade de isostaticidade, mas mecanismos e vínculos ineficazes ainda precisam ser descartados.' },
    ],
    caution: 'Momento em rótula é zero; não zere as forças transmitidas por ela.',
  },
  'Cargas distribuídas': {
    intro: 'Uma carga distribuída q(x) atua por unidade de comprimento. Seu efeito no equilíbrio global pode ser substituído pela resultante, mas os diagramas dependem de toda a função de carga.',
    sections: [
      { title: 'Resultante e posição', text: 'A força equivalente é Q = ∫q(x)dx. Sua posição é x̄ = ∫xq(x)dx / Q, medida a partir de uma origem definida. Para carga uniforme q em comprimento L, Q=qL e x̄=L/2.' },
      { title: 'Exemplo de carga uniforme', text: 'Para q=4 kN/m em 6 m, Q=24 kN aplicada a 3 m do início. Em uma viga biapoiada simétrica, cada reação vertical é 12 kN e o momento máximo no meio é qL²/8 = 18 kN·m.' },
      { title: 'Relações diferenciais', text: 'Com a convenção adotada, dV/dx=−q(x) e dM/dx=V(x). Integre por trechos, aplique saltos de cargas pontuais e verifique condições de apoio e continuidade.' },
    ],
    caution: 'Em elementos inclinados, esclareça se q é por comprimento real da barra ou por projeção horizontal.',
  },
  'ABNT NBR 13133': {
    intro: 'A NBR 13133 estabelece requisitos para execução de levantamentos topográficos. A aplicação depende do objetivo, classe de precisão, métodos e edição vigente.',
    sections: [
      { title: 'Planejamento do levantamento', text: 'Defina finalidade, sistema de referência, datum, método, pontos de apoio, tolerâncias e produtos. Verifique as especificações do contratante além da norma.' },
      { title: 'Campo e controle', text: 'Registre equipamentos, calibração, observações, redundâncias, fechamento e rastreabilidade. Faça verificações independentes para detectar erro grosseiro antes do ajuste.' },
      { title: 'Produtos e apresentação', text: 'Apresente coordenadas, cotas, orientação, escala, datum, fuso, precisão e convenções usadas. Arquive cadernetas e metadados para permitir auditoria.' },
    ],
    caution: 'Consulte o texto normativo oficial e a edição especificada no contrato; este resumo não reproduz todos os requisitos.',
  },
  'ABNT NBR 5681': {
    intro: 'A NBR 5681 trata do controle tecnológico da execução de aterros em obras de edificações. O controle deve ser compatível com o projeto e com o material efetivamente empregado.',
    sections: [
      { title: 'Caracterização e execução', text: 'Caracterize o solo e sua referência de compactação. Prepare a fundação, espalhe camadas controladas, ajuste a umidade, compacte com equipamento adequado e registre a execução.' },
      { title: 'Ensaios e aceitação', text: 'Compare densidade seca de campo com a densidade seca máxima do ensaio de referência e verifique umidade. Frequência, locais e limites de aceitação devem seguir a norma vigente, projeto e plano de controle.' },
      { title: 'Ação corretiva', text: 'Se o resultado não atende ao critério, delimite o lote, avalie umidade e espessura, retrabalhe ou substitua material e ensaie novamente antes de cobrir a camada.' },
    ],
    caution: 'Não trate GC mínimo ou faixa de umidade como valor universal; use o critério explícito do projeto/contrato e a edição vigente.',
  },
  'Especificações DNIT': {
    intro: 'O DNIT publica especificações e métodos de controle para serviços rodoviários. O código aplicável depende do serviço e da documentação contratual.',
    sections: [
      { title: 'Localize a especificação correta', text: 'Identifique se o serviço é terraplenagem, pavimentação, drenagem ou outro. Confira código, edição, erratas e documentos complementares listados no contrato.' },
      { title: 'Critérios de medição', text: 'Verifique unidade de medição, categoria de material, transporte, equipamentos, tolerâncias geométricas e ensaios de aceitação. Essas definições afetam produção e pagamento.' },
      { title: 'Rastreabilidade', text: 'Associe cada ensaio ao segmento, camada, estaca, lote de material, equipamento e data. Registre não conformidades e liberação formal.' },
    ],
    caution: 'As especificações DNIT variam por serviço e revisão; use a versão identificada no edital/contrato.',
  },
  'ABNT NBR 11682': {
    intro: 'A NBR 11682 trata de estabilidade de encostas e taludes. Pode orientar a análise global de uma solução de contenção quando o mecanismo envolve o maciço.',
    sections: [
      { title: 'Investigação e modelo', text: 'Reúna estratigrafia, parâmetros de resistência, nível d’água, geometria, carregamentos e condições de drenagem. Defina mecanismos de ruptura plausíveis e método de análise.' },
      { title: 'Estabilidade global', text: 'Analise superfícies passando atrás, abaixo ou através da contenção. Considere fases construtivas, sobrecargas, água e consequências da ruptura.' },
      { title: 'Outras verificações', text: 'A estabilidade global não substitui deslizamento, tombamento, capacidade de suporte, deformações e dimensionamento estrutural do muro.' },
    ],
    caution: 'Confirme escopo e edição vigente; a norma de taludes não é uma norma completa de dimensionamento estrutural de muros.',
  },
};

const state = {
  view: 'home',
  category: 'estruturas',
  menuOpen: false,
  tool: 'pencil',
  color: '#175b8d',
  canvasUndo: [],
  canvasRedo: [],
  imageUrl: '',
  calculationModel: createDemoModel(),
  calculationResults: null,
  calculationError: '',
  summaryIndex: 0,
  articleIndex: 0,
  summaryQuery: '',
  summaryKind: 'todos',
  toastTimer: 0,
};

const mainView = document.querySelector('#mainView');
const sidebar = document.querySelector('#sidebar');
const scrim = document.querySelector('#drawerScrim');

function icon(name, className = '') {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.document}</svg>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
}

function setView(view, category = state.category) {
  state.view = view;
  state.category = category;
  state.menuOpen = false;
  render();
  mainView.focus({ preventScroll: true });
}

function renderSidebar() {
  const links = categories.map((item) => `
    <button class="side-link ${state.view === 'category' && state.category === item.id ? 'active' : ''}" type="button" data-action="open-category" data-category="${item.id}">
      <span class="small-icon">${icon(item.icon)}</span>${item.name}
    </button>`).join('');
  sidebar.innerHTML = `
    <p class="side-label">Seu caderno</p>
    <button class="side-link ${state.view === 'home' ? 'active' : ''}" type="button" data-action="go-home"><span class="small-icon">${icon('home')}</span>Início</button>
    <div class="side-divider"></div>
    <p class="side-label">Disciplinas</p>
    ${links}
    <div class="side-divider"></div>
    <button class="side-link" type="button" data-action="show-about"><span class="small-icon">${icon('document')}</span>Sobre o protótipo</button>
    <p class="side-foot">Conteúdo de apoio aos estudos.<br>Confira sempre normas e especificações vigentes.</p>`;
  sidebar.classList.toggle('open', state.menuOpen);
  scrim.classList.toggle('open', state.menuOpen);
}

function categoryTile(item) {
  return `<button class="category-tile" type="button" data-action="open-category" data-category="${item.id}">
    <span class="tile-icon">${icon(item.icon)}</span>
    <span><strong>${item.name}</strong><span class="tile-count">${item.count}</span></span>
  </button>`;
}

function renderHome() {
  const tiles = categories.filter((item) => ['estruturas', 'topografia', 'terraplenagem', 'muros', 'normas', 'solos'].includes(item.id));
  return `<div class="page-wrap home-layout">
    <section class="home-main">
      <div class="page-heading">
        <div><p class="eyebrow">Caderno digital · Engenharia Civil</p><h1>Estude. Desenhe. Entenda.</h1><p class="lede">Conceitos essenciais, normas de referência e ferramentas práticas para acompanhar seus estudos.</p></div>
        <div class="heading-actions"><button class="primary-button" type="button" data-action="open-structures">${icon('pencil')}Desenhar estrutura</button></div>
      </div>
      <label class="search-wrap">${icon('search')}<input id="contentSearch" type="search" placeholder="Pesquisar conteúdos..." autocomplete="off" aria-label="Pesquisar conteúdos"><span class="mobile-only">⌕</span></label>
      <div class="section-head"><h2>Disciplinas</h2><p>6 áreas em destaque</p></div>
      <div class="category-grid" id="categoryGrid">${tiles.map(categoryTile).join('')}</div>
      <section class="recent-section">
        <div class="section-head"><h2>Continue de onde parou</h2><button class="text-button" type="button" data-action="open-category" data-category="estruturas">Ver tudo</button></div>
        <div class="recent-list">
          <button class="recent-item" type="button" data-action="open-content" data-category="estruturas" data-index="1"><span class="recent-icon">${icon('structure')}</span><span><strong>Diagramas de esforços em pórticos</strong><small>Estruturas · Nós rígidos e rótulas</small></span>${icon('arrow')}</button>
          <button class="recent-item" type="button" data-action="open-category" data-category="normas"><span class="recent-icon">${icon('book')}</span><span><strong>NBR 13133 · Levantamentos</strong><small>Normas · Topografia</small></span>${icon('arrow')}</button>
        </div>
      </section>
    </section>
    <aside class="side-panel">
      <div class="welcome-card"><p class="eyebrow">Seu espaço de estudo</p><h2>Do campo ao projeto.</h2><p>Reúna fundamentos, cálculos e esboços em um só lugar.</p><button type="button" data-action="open-category" data-category="topografia">Explorar Topografia ${icon('arrow')}</button></div>
      <div class="mini-stat"><div class="mini-stat-head"><span>Trilha de estudos</span><strong>4 de 9 temas</strong></div><div class="progress-track"><span></span></div></div>
      <div class="tip-card"><p class="eyebrow">Nota técnica</p><p>Critérios como grau de compactação e umidade devem seguir o projeto e a especificação aplicável à obra.</p></div>
    </aside>
  </div>`;
}

function renderCategory() {
  const category = categories.find((item) => item.id === state.category) || categories[0];
  const cards = content[category.id] || [];
  const cardMarkup = cards.length ? cards.map((item, index) => `
    <article class="content-card" data-searchable="${escapeHtml(`${item[0]} ${item[1]} ${item[2].join(' ')}`.toLowerCase())}">
      <div class="content-card-top"><div><p class="eyebrow">${category.name} · Guia ${String(index + 1).padStart(2, '0')}</p><h3>${item[0]}</h3></div><span class="tile-icon">${icon(category.icon)}</span></div>
      <p>${item[1]}</p><div class="tag-row">${item[2].map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
      <button class="quiet-button card-open" type="button" data-action="open-content" data-category="${category.id}" data-index="${index}">Abrir resumo ${icon('arrow')}</button>
    </article>`).join('') : '<div class="empty-state">Os materiais desta área estão sendo organizados. Enquanto isso, explore Topografia, Terraplenagem, Estruturas e Muros.</div>';
  return `<div class="page-wrap">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<span>${category.name}</span></nav>
    <div class="page-heading"><div><p class="eyebrow">Caderno de referência</p><h1>${category.name}</h1><p class="lede">${category.count} para apoiar a revisão dos conceitos e a resolução de exercícios.</p></div>
      <div class="heading-actions">${category.id === 'estruturas' ? '<button class="primary-button" type="button" data-action="open-structures">' + icon('pencil') + 'Desenhar</button>' : ''}</div>
    </div>
    ${category.id === 'normas' ? '<div class="analysis-panel" style="margin-bottom:16px"><strong>Uso responsável das referências</strong><p>Confira a edição vigente das normas e as especificações do contrato. Valores didáticos não substituem critérios definidos pelo projeto.</p></div>' : ''}
    <div class="content-grid" id="contentGrid">${cardMarkup}</div>
  </div>`;
}

function normalizeSearchText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getSummarySections(categoryId, index, item) {
  if (categoryId === 'topografia') return topographyDetails[index] || [];
  const detailed = summaryExtras[categoryId]?.[index];
  if (detailed) return detailed;
  return [
    { kind: 'teoria', title: 'Conceito essencial', text: item[1] },
    { kind: 'aplicacao', title: 'Tópicos relacionados', text: `Use estes termos para orientar a revisão: ${item[2].join(', ')}. Confira hipóteses, unidades e critérios do projeto ao resolver exercícios.` },
  ];
}

function renderSummary() {
  const category = categories.find((item) => item.id === state.category) || categories[0];
  const item = (content[state.category] || [])[state.summaryIndex];
  if (!item) return renderCategory();
  const sections = getSummarySections(state.category, state.summaryIndex, item);
  const matchingSections = sections.map((section, originalIndex) => ({ ...section, originalIndex })).filter((section) => {
    const kindMatches = state.summaryKind === 'todos' || section.kind === state.summaryKind;
    const queryMatches = !state.summaryQuery || normalizeSearchText(`${section.title} ${section.text} ${section.kind} ${category.name}`)
      .includes(normalizeSearchText(state.summaryQuery));
    return kindMatches && queryMatches;
  });
  const kindLabels = { teoria: 'Teoria', calculo: 'Cálculo', verificacao: 'Verificação', norma: 'Norma', aplicacao: 'Aplicação' };
  return `<div class="page-wrap">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<button type="button" data-action="open-category" data-category="${state.category}">${category.name}</button>${icon('arrow')}<span>Resumo</span></nav>
    <div class="page-heading"><div><p class="eyebrow">${category.name} · Resumo ${String(state.summaryIndex + 1).padStart(2, '0')}</p><h1>${item[0]}</h1><p class="lede">${item[1]}</p></div></div>
    <div class="summary-search-panel">
      <label class="search-wrap">${icon('search')}<input id="summarySearch" type="search" value="${escapeHtml(state.summaryQuery)}" placeholder="Buscar neste resumo: teoria, cálculo, fórmulas..." autocomplete="off" aria-label="Buscar dentro do resumo"></label>
      <label class="summary-kind-filter"><span>Mostrar</span><select id="summaryKind"><option value="todos" ${state.summaryKind === 'todos' ? 'selected' : ''}>Todos os tópicos</option><option value="teoria" ${state.summaryKind === 'teoria' ? 'selected' : ''}>Teoria</option><option value="calculo" ${state.summaryKind === 'calculo' ? 'selected' : ''}>Cálculos</option><option value="verificacao" ${state.summaryKind === 'verificacao' ? 'selected' : ''}>Verificações</option><option value="norma" ${state.summaryKind === 'norma' ? 'selected' : ''}>Normas</option><option value="aplicacao" ${state.summaryKind === 'aplicacao' ? 'selected' : ''}>Aplicações</option></select></label>
      <span class="summary-match-count" id="summaryMatchCount">${matchingSections.length} ${matchingSections.length === 1 ? 'tópico' : 'tópicos'}</span>
    </div>
    <div class="summary-sections" id="summarySections">${matchingSections.map((section, index) => `
      <article class="summary-block" data-summary-kind="${section.kind}" data-summary-search="${escapeHtml(normalizeSearchText(`${section.title} ${section.text} ${section.kind} ${category.name}`))}">
        <div class="summary-block-head"><span class="summary-number">${String(index + 1).padStart(2, '0')}</span><span class="tag">${kindLabels[section.kind] || 'Tópico'}</span></div>
        <h2>${section.title}</h2><p>${section.text}</p>
        <button class="quiet-button article-open" type="button" data-action="open-article" data-section-index="${section.originalIndex}">Abrir conteúdo completo ${icon('arrow')}</button>
      </article>`).join('') || '<div class="empty-state" id="summaryEmpty">Nenhum tópico corresponde a essa busca. Tente “teoria”, “cálculo”, “azimute” ou “nivelamento”.</div>'}</div>
    <div class="summary-footer"><button class="outline-button" type="button" data-action="open-category" data-category="${state.category}">${icon('back')}Voltar aos conteúdos</button>${state.category === 'estruturas' ? '<button class="primary-button" type="button" data-action="open-calculator">Modelar uma estrutura</button>' : ''}</div>
  </div>`;
}

function renderArticle() {
  const category = categories.find((item) => item.id === state.category) || categories[0];
  const item = (content[state.category] || [])[state.summaryIndex];
  const section = getSummarySections(state.category, state.summaryIndex, item || [])[state.articleIndex];
  if (!item || !section) return renderCategory();

  const lesson = fullLessons[section.title] || {
    intro: section.text,
    sections: [
      { title: 'Conceito central', text: section.text },
      { title: 'Como estudar este tópico', text: `Relacione o tema a ${item[0].toLowerCase()}. Identifique os dados conhecidos, declare as hipóteses, mantenha as unidades consistentes e confira o resultado com as condições do problema.` },
    ],
    caution: 'Confirme as hipóteses e os critérios aplicáveis ao exercício, projeto ou especificação vigente.',
  };
  const kindLabels = { teoria: 'Teoria', calculo: 'Cálculo', verificacao: 'Verificação', norma: 'Norma', aplicacao: 'Aplicação' };
  return `<div class="page-wrap article-page">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<button type="button" data-action="open-category" data-category="${state.category}">${category.name}</button>${icon('arrow')}<button type="button" data-action="back-to-summary">${item[0]}</button>${icon('arrow')}<span>Conteúdo</span></nav>
    <div class="page-heading"><div><p class="eyebrow">${category.name} · ${kindLabels[section.kind] || 'Estudo'}</p><h1>${section.title}</h1><p class="lede">${lesson.intro}</p></div></div>
    <article class="article-sheet">
      ${lesson.sections.map((part, index) => `<section class="article-section"><div class="article-section-title"><span class="summary-number">${String(index + 1).padStart(2, '0')}</span><h2>${part.title}</h2></div><p>${part.text}</p></section>`).join('')}
      ${lesson.caution ? `<aside class="article-note"><strong>Atenção</strong><p>${lesson.caution}</p></aside>` : ''}
    </article>
    <div class="summary-footer"><button class="outline-button" type="button" data-action="back-to-summary">${icon('back')}Voltar ao resumo</button><button class="primary-button" type="button" data-action="open-category" data-category="${state.category}">Ver outros tópicos</button></div>
  </div>`;
}

function filterSummarySections() {
  const query = normalizeSearchText(document.querySelector('#summarySearch')?.value || '');
  const kind = document.querySelector('#summaryKind')?.value || 'todos';
  const blocks = [...document.querySelectorAll('[data-summary-kind]')];
  let visible = 0;
  for (const block of blocks) {
    const matches = (kind === 'todos' || block.dataset.summaryKind === kind) && block.dataset.summarySearch.includes(query);
    block.hidden = !matches;
    if (matches) visible += 1;
  }
  const count = document.querySelector('#summaryMatchCount');
  if (count) count.textContent = `${visible} ${visible === 1 ? 'tópico' : 'tópicos'}`;
  const empty = document.querySelector('#summaryEmpty');
  if (empty) empty.hidden = visible > 0;
  else if (visible === 0 && !document.querySelector('#summaryEmpty')) {
    document.querySelector('#summarySections')?.insertAdjacentHTML('beforeend', '<div class="empty-state" id="summaryEmpty">Nenhum tópico corresponde a essa busca. Tente “teoria”, “cálculo”, “azimute” ou “nivelamento”.</div>');
  }
}

function renderStructures() {
  return `<div class="page-wrap">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<span>Estruturas</span></nav>
    <div class="page-heading"><div><p class="eyebrow">Ferramentas de estruturas</p><h1>Escolha como começar</h1><p class="lede">Modele uma estrutura, desenhe diretamente no canvas com estilo Ftool ou envie uma foto de referência.</p></div></div>
    <div class="structure-options structure-options-three">
      <button class="option-card" type="button" data-action="open-canvas"><span class="option-icon">${icon('pencil')}</span><h2>Desenho Interativo (Ftool 2D)</h2><p>Grelha, snap magnético, apoios, cargas e diagramas N, V, M instantâneos</p></button>
      <button class="option-card" type="button" data-action="open-calculator"><span class="option-icon">${icon('structure')}</span><h2>Modelar em Tabela</h2><p>Informe nós, barras, apoios e cargas via formulário</p></button>
      <button class="option-card" type="button" data-action="open-upload"><span class="option-icon">${icon('camera')}</span><h2>Foto e cálculo</h2><p>Use a imagem como referência do modelo</p></button>
    </div>
  </div>`;
}

function renderCanvas() {
  return `<div class="page-wrap" style="width:min(1240px, 100%);">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<button type="button" data-action="open-structures">Estruturas</button>${icon('arrow')}<span>Módulo Ftool Interativo</span></nav>
    <div class="page-heading">
      <div>
        <p class="eyebrow">Análise Computacional de Estruturas Planas</p>
        <h1>Desenho Interativo estilo Ftool</h1>
        <p class="lede">Grelha configurável com atração magnética (snap), ferramentas de inserção de nós e barras (com Shift para travar a 0°, 45° e 90°), linhas de cota, condições de apoio (1ª e 2ª ordem, engaste e molas), rótulas, cargas e cálculo de diagramas (N, V, M) e deformada.</p>
      </div>
      <div class="heading-actions">
        <button class="outline-button" type="button" data-action="sync-ftool-to-table" title="Preencher o modelo de formulário com a estrutura desenhada">Preencher Tabela</button>
        <button class="outline-button" type="button" data-action="open-structures">Voltar</button>
      </div>
    </div>
    <div id="ftoolStudioMount"></div>
  </div>`;
}

function renderUpload() {
  return `<div class="page-wrap">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<button type="button" data-action="open-structures">Estruturas</button>${icon('arrow')}<span>Enviar foto</span></nav>
    <div class="page-heading"><div><p class="eyebrow">Registro visual</p><h1>Enviar foto</h1><p class="lede">Carregue uma imagem como referência e depois confirme geometria, vínculos e ações no modelo de cálculo.</p></div><div class="heading-actions"><button class="outline-button" type="button" data-action="open-structures">Voltar</button></div></div>
    <div class="upload-layout">
      <section class="upload-main">
        <label class="upload-drop" id="uploadDrop" for="galleryInput"><span class="option-icon">${icon('image')}</span><strong>Toque para escolher uma imagem</strong><small>JPG ou PNG · arraste o arquivo até aqui</small></label>
        <input class="visually-hidden" id="galleryInput" type="file" accept="image/png,image/jpeg,image/webp" />
        <input class="visually-hidden" id="cameraInput" type="file" accept="image/*" capture="environment" />
        <div class="file-actions"><button class="primary-button" type="button" data-action="open-camera">${icon('camera')}Câmera</button><button class="outline-button" type="button" data-action="open-gallery">${icon('image')}Galeria</button></div>
      </section>
      <aside class="preview-card"><h3>Pré-visualização</h3><div class="image-preview" id="imagePreview"><div class="image-placeholder">${icon('image')}<span>Nenhuma imagem selecionada</span></div></div><p class="preview-meta" id="previewMeta">JPG / PNG / WEBP</p><div class="analysis-panel" id="analysisPanel"><strong>Como o cálculo funciona</strong><p>A imagem não fornece escala e condições de apoio por si só. Confira e transcreva os dados antes de resolver.</p></div><button class="primary-button" style="width:100%;margin-top:12px" type="button" data-action="continue-to-calculation" id="continueCalculation" disabled>${icon('structure')}Confirmar modelo e calcular</button></aside>
    </div>
  </div>`;
}

function renderAbout() {
  return `<div class="page-wrap"><nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<span>Sobre</span></nav><div class="page-heading"><div><p class="eyebrow">EngCivil</p><h1>Um caderno para aprender</h1><p class="lede">Protótipo interativo para estudar fundamentos de Engenharia Civil e registrar ideias de projeto.</p></div></div><div class="content-grid"><article class="content-card"><h3>Referências de estudo</h3><p>Os resumos não substituem as normas completas, o projeto executivo ou a avaliação de profissional habilitado.</p><div class="tag-row"><span class="tag">NBR 13133</span><span class="tag">NBR 5681</span><span class="tag">DNIT</span><span class="tag">NBR 11682</span></div></article><article class="content-card"><h3>Desenhos e imagens</h3><p>Os esboços e pré-análises deste protótipo são ferramentas de anotação. Não fazem verificação estrutural automática nem laudo técnico.</p></article></div></div>`;
}

function render() {
  renderSidebar();
  mainView.innerHTML = state.view === 'home' ? renderHome()
    : state.view === 'category' ? renderCategory()
    : state.view === 'summary' ? renderSummary()
    : state.view === 'article' ? renderArticle()
    : state.view === 'structures' ? renderStructures()
    : state.view === 'canvas' ? renderCanvas()
    : state.view === 'upload' ? renderUpload()
    : state.view === 'calculator' ? renderCalculationView(state.calculationModel, state.imageUrl, state.calculationResults, state.calculationError)
    : renderAbout();
  if (state.view === 'canvas') setupCanvas();
  if (state.view === 'upload') setupUpload();
}

function setupCanvas() {
  const mount = document.querySelector('#ftoolStudioMount');
  if (!mount) return;
  state.ftoolApp = new FtoolCanvasApp(mount, {
    onModelChange: (model, results) => {
      // Model updated
    },
  });
}


function setupUpload() {
  const galleryInput = document.querySelector('#galleryInput');
  const cameraInput = document.querySelector('#cameraInput');
  const drop = document.querySelector('#uploadDrop');
  const selectFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Escolha um arquivo de imagem.');
      return;
    }
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = URL.createObjectURL(file);
    document.querySelector('#imagePreview').innerHTML = `<img src="${state.imageUrl}" alt="Imagem selecionada para revisão">`;
    document.querySelector('#previewMeta').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    document.querySelector('#analysisPanel').innerHTML = '<strong>Imagem pronta</strong><p>Transcreva as dimensões, vínculos e cargas visíveis para obter resultados coerentes.</p>';
    document.querySelector('#continueCalculation').disabled = false;
  };
  galleryInput.addEventListener('change', () => selectFile(galleryInput.files?.[0]));
  cameraInput.addEventListener('change', () => selectFile(cameraInput.files?.[0]));
  drop.addEventListener('dragover', (event) => { event.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    drop.classList.remove('dragover');
    selectFile(event.dataTransfer?.files?.[0]);
  });
}

function saveCalculationModelFromForm() {
  const form = document.querySelector('#modelForm');
  if (form) state.calculationModel = readCalculationModel(form);
  return state.calculationModel;
}

function addModelRow(action) {
  const model = saveCalculationModelFromForm();
  if (action === 'add-node') {
    let index = model.nodes.length + 1;
    let name = `N${index}`;
    while (model.nodes.some((node) => node.name === name)) name = `N${++index}`;
    const maxX = Math.max(0, ...model.nodes.map((node) => Number(node.x) || 0));
    model.nodes.push({ name, x: maxX + 1, y: 0, joint: 'rigido', support: 'none', reactionAngle: 90 });
  } else if (action === 'add-bar') {
    if (model.nodes.length < 2) return showToast('Adicione pelo menos dois nós antes da barra.');
    let index = model.bars.length + 1;
    let name = `B${index}`;
    while (model.bars.some((bar) => bar.name === name)) name = `B${++index}`;
    model.bars.push({ name, start: model.nodes[0].name, end: model.nodes.at(-1).name, qx: 0, qy: 0 });
  } else if (action === 'add-nodal-load') {
    if (!model.nodes.length) return showToast('Adicione um nó antes da carga.');
    model.nodalLoads.push({ node: model.nodes[0].name, fx: 0, fy: 0, moment: 0 });
  } else if (action === 'add-point-load') {
    if (!model.bars.length) return showToast('Adicione uma barra antes da carga.');
    model.pointLoads.push({ bar: model.bars[0].name, position: 0, fx: 0, fy: 0 });
  }
  state.calculationModel = model;
  state.calculationResults = null;
  state.calculationError = '';
  render();
}

function calculateCurrentModel() {
  const model = saveCalculationModelFromForm();
  state.calculationModel = model;
  try {
    state.calculationResults = calculateFrame(model);
    state.calculationError = '';
    render();
    window.setTimeout(() => document.querySelector('#calculationResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  } catch (error) {
    state.calculationResults = null;
    state.calculationError = error instanceof Error ? error.message : 'Erro inesperado ao montar o modelo.';
    render();
  }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'toggle-menu') { state.menuOpen = !state.menuOpen; renderSidebar(); }
  if (action === 'close-menu') { state.menuOpen = false; renderSidebar(); }
  if (action === 'go-home') setView('home');
  if (action === 'open-category') setView('category', button.dataset.category);
  if (action === 'open-structures') setView('structures');
  if (action === 'open-canvas') setView('canvas');
  if (action === 'open-upload') setView('upload');
  if (action === 'open-calculator') {
    state.calculationModel = createDemoModel();
    state.calculationResults = null;
    state.calculationError = '';
    setView('calculator');
  }
  if (action === 'continue-to-calculation') {
    if (!state.imageUrl) return showToast('Selecione uma foto antes de continuar.');
    state.calculationModel = createDemoModel();
    state.calculationResults = null;
    state.calculationError = '';
    setView('calculator');
  }
  if (['add-node', 'add-bar', 'add-nodal-load', 'add-point-load'].includes(action)) addModelRow(action);
  if (action === 'calculate-frame') calculateCurrentModel();
  if (action === 'show-about') setView('about');
  if (action === 'open-content') {
    state.summaryIndex = Number(button.dataset.index);
    state.summaryQuery = '';
    state.summaryKind = 'todos';
    setView('summary', button.dataset.category);
  }
  if (action === 'open-article') {
    state.articleIndex = Number(button.dataset.sectionIndex);
    setView('article', state.category);
  }
  if (action === 'back-to-summary') setView('summary', state.category);
  if (action === 'sync-ftool-to-table') {
    if (!state.ftoolApp) return;
    const fNodes = state.ftoolApp.nodes;
    const fMembers = state.ftoolApp.members;
    const fLoads = state.ftoolApp.nodalLoads;
    if (fNodes.length === 0) {
      showToast('Desenhe a estrutura antes de transferir.');
      return;
    }
    state.calculationModel = {
      nodes: fNodes.map((n) => ({
        name: n.name || n.id,
        x: n.x,
        y: n.y,
        joint: 'rigido',
        support: n.support?.fixX && n.support?.fixY && n.support?.fixRz ? 'engaste'
          : n.support?.fixX && n.support?.fixY ? 'articulado'
          : n.support?.fixY ? 'rolete'
          : 'none',
        reactionAngle: 90,
      })),
      bars: fMembers.map((m) => {
        const n1 = fNodes.find((n) => n.id === m.startNodeId);
        const n2 = fNodes.find((n) => n.id === m.endNodeId);
        const dload = m.distributedLoads?.[0];
        return {
          name: m.name || m.id,
          start: n1?.name || n1?.id || '',
          end: n2?.name || n2?.id || '',
          qx: dload?.direction === 'global' ? (dload.qxi || 0) : 0,
          qy: dload?.direction === 'global' ? (dload.qyi || 0) : 0,
        };
      }),
      nodalLoads: fLoads.map((l) => {
        const n = fNodes.find((node) => node.id === l.nodeId);
        return {
          node: n?.name || n?.id || '',
          fx: l.fx || 0,
          fy: l.fy || 0,
          moment: l.mz || 0,
        };
      }),
      pointLoads: [],
    };
    state.calculationResults = null;
    state.calculationError = '';
    setView('calculator');
    showToast('Estrutura transferida para o modelo de tabela!');
  }
  if (action === 'open-gallery') document.querySelector('#galleryInput')?.click();
  if (action === 'open-camera') document.querySelector('#cameraInput')?.click();
  if (action === 'analyze-image') {
    document.querySelector('#analysisPanel').innerHTML = '<strong>Revisão visual preparada</strong><p>Use esta imagem como registro de estudo. O protótipo não interpreta esforços, estabilidade ou segurança estrutural.</p>';
    showToast('Imagem pronta para revisão de estudo.');
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'summarySearch') {
    state.summaryQuery = event.target.value;
    filterSummarySections();
    return;
  }
  if (event.target.id !== 'contentSearch') return;
  const query = event.target.value.trim().toLocaleLowerCase('pt-BR');
  const grid = document.querySelector('#categoryGrid');
  if (grid) {
    const matches = categories.filter((item) => `${item.name} ${item.count}`.toLocaleLowerCase('pt-BR').includes(query));
    grid.innerHTML = matches.length ? matches.map(categoryTile).join('') : '<div class="empty-state">Nenhuma disciplina encontrada.</div>';
  }
});

document.addEventListener('change', (event) => {
  if (event.target.id !== 'summaryKind') return;
  state.summaryKind = event.target.value;
  filterSummarySections();
});

render();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}