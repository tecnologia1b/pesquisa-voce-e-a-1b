// Extraído de docs/prototipo-voce-e-a-1b.html — NÃO alterar textos, opções, max, ex, se.
export const CONCORDO={1:"Discordo totalmente",2:"Discordo",3:"Nem concordo nem discordo",4:"Concordo",5:"Concordo plenamente"};
export const DESEJO={1:"Nada",2:"Pouco",3:"Mais ou menos",4:"Bastante",5:"Muito"};
export const LIDER=["Líder ou auxiliar de PGM","Supervisor","Coordenador"];
export const Q=[
 // Quem é você
 {id:"p1",s:"Quem é você",t:"unica",q:"Qual a sua idade?",o:["12 a 14","15 a 17","18 a 24","25 a 29","30 a 44","45+"]},
 {id:"p2",s:"Quem é você",t:"multipla",q:"Qual o seu papel hoje?",i:"Pode marcar mais de um.",o:["Frequento os cultos","Participo de PGM","Líder ou auxiliar de PGM","Supervisor","Coordenador","Pastor"]},
 {id:"p3",s:"Quem é você",t:"unica",q:"De qual rede você participa?",o:["Livres","Flow","Outra","Não participo"]},
 {id:"p4",s:"Quem é você",t:"unica",q:"Há quanto tempo você frequenta a 1B?",o:["Menos de 1 ano","1 a 3 anos","4 a 10 anos","11 a 15 anos","Mais de 15 anos"]},
 {id:"p5",s:"Quem é você",t:"unica",q:"Qual frase descreve melhor o seu momento de vida?",o:["Estou na escola","Estou na faculdade ou cursinho","Estou começando a trabalhar","Trabalho e já tenho carreira","Casei ou formei família recentemente","Outro momento"]},
 // Seu momento e seus anseios
 {id:"p6",s:"Seu momento",t:"multipla",max:3,q:"Que tipo de programa você sente falta na igreja para o seu momento de vida?",i:"Escolha até 3.",o:["Encontros e retiros da minha idade","Estudo bíblico e discipulado","Orientação para a vida (estudos, carreira, finanças)","Relacionamentos, namoro e família","Saúde emocional","Esporte e lazer","Ação social e missões","Música e artes","Mentoria com alguém mais experiente","Não sinto falta de nada"],ex:["Não sinto falta de nada"]},
 {id:"p7",s:"Seu momento",t:"escala",lb:DESEJO,q:"O quanto você deseja atividades voltadas para a sua faixa etária?"},
 {id:"p8",s:"Seu momento",t:"escala",lb:DESEJO,q:"O quanto você deseja atividades junto com pessoas de outras idades?"},
 {id:"p9",s:"Seu momento",t:"aberta",q:"Que programa ou atividade você gostaria que a igreja tivesse para pessoas da sua idade?"},
 // Sua fé
 {id:"p10",s:"Sua fé",t:"multipla",max:3,q:"O que mais te atrai num culto?",i:"Escolha até 3.",o:["Tempo longo de louvor e adoração","Pregação profunda","Pregação prática e direta","Momento de oração e ministração","Ambiente mais intimista","Culto grande e cheio de gente","Testemunhos","Cultos temáticos e especiais"]},
 {id:"p11",s:"Sua fé",t:"multipla",max:3,q:"Que tipo de movimento ou evento cristão mais te atrai?",i:"Escolha até 3.",o:["Conferências e congressos","Acampamentos e retiros","Vigílias","PGM e grupos pequenos","Festivais e shows gospel","Projetos missionários e sociais","Conteúdo online (pregações, podcasts)"]},
 {id:"p12",s:"Sua fé",t:"multipla",q:"Onde você mais consome conteúdo cristão fora da igreja?",i:"Pode marcar mais de um.",o:["Instagram","YouTube","TikTok","Spotify ou podcasts","Livros","Quase não consumo"],ex:["Quase não consumo"]},
 {id:"p13",s:"Sua fé",t:"aberta",q:"Que igrejas, ministérios, pregadores ou movimentos te inspiram?",ph:"Pode citar nomes"},
 {id:"p14",s:"Sua fé",t:"unica",q:"Com que frequência você lê a Bíblia por conta própria?",o:["Todo dia","Algumas vezes por semana","Algumas vezes por mês","Raramente ou nunca"]},
 // Você na 1B
 {id:"p15",s:"Você na 1B",t:"multipla",q:"De quais cultos da 1B você costuma participar?",i:"Pode marcar mais de um.",o:["Sábado 19h","Domingo 8h","Domingo 10h","Domingo 17h","Domingo 19h"]},
 {id:"p16",s:"Você na 1B",t:"unica",q:"Com que frequência você vem a algum culto da 1B?",o:["Toda semana","2 a 3 vezes por mês","1 vez por mês ou menos"]},
 {id:"p17",s:"Você na 1B",t:"multipla",max:4,q:"O que mais te faz voltar aos cultos que você frequenta?",i:"Escolha até 4.",o:["Meus amigos estão lá","Minha família vai","Louvor","Pregação","Ambiente","Horário","Sirvo no culto","Meu PGM vai junto"]},
 {id:"p18",s:"Você na 1B",t:"multipla",max:4,q:"O que mais dificulta você participar de outros cultos e programações da igreja, além dos que já vai?",i:"Escolha até 4.",o:["Horário ou compromissos","Minha família não vai","Não conheço muita gente","Estilo do louvor","Linguagem da pregação","Duração","Sinto que não é pra mim","Já participo o suficiente","Nada dificulta"],ex:["Nada dificulta"]},
 {id:"p19",s:"Você na 1B",t:"grade",lb:CONCORDO,q:"O quanto você concorda?",it:["Me sinto parte da igreja como um todo.","Conheço pelo nome pessoas mais velhas da igreja.","Tenho alguém mais velho que me inspira na fé.","Eu me sentiria à vontade em qualquer culto da 1B, de qualquer horário.","Gostaria de conviver mais com pessoas de outras idades na igreja."]},
 {id:"p20",s:"Você na 1B",t:"unica",q:"Quantos adultos da igreja com mais de 40 anos, fora da sua família, você conhece pelo nome?",o:["Nenhum","1 ou 2","3 a 5","6 ou mais"]},
 {id:"p21",s:"Você na 1B",t:"unica",q:"Nos últimos 3 meses, quantas vezes você conversou de verdade (mais que um “oi”) com um adulto da igreja com mais de 40 anos, fora da sua família?",o:["Nenhuma vez","1 vez","2 a 5 vezes","Mais de 5 vezes"]},
 {id:"p22",s:"Você na 1B",t:"unica",q:"Se você precisasse de um conselho, tem algum adulto da igreja, fora da sua família e da liderança do seu PGM, que você procuraria?",o:["Sim, já sei quem","Talvez","Não"]},
 {id:"p23",s:"Você na 1B",t:"multipla",max:3,q:"Que tipo de momento te aproximaria das outras gerações da igreja?",i:"Escolha até 3.",o:["Servir junto em ação social","Discipulado ou mentoria com alguém mais velho","Servir num ministério junto com adultos (louvor, recepção, mídia)","Café ou lanche depois do culto","Eventos especiais com toda a igreja","Cultos especiais com todas as idades juntas","Outro"]},
 {id:"p24",s:"Você na 1B",t:"aberta",q:"O que você acha que a sua geração precisa aprender com os mais velhos?"},
 // Liderança
 {id:"p25",s:"Para a liderança",t:"unica",q:"Dos adolescentes e jovens do seu PGM ou área, quantos também participam de cultos de domingo?",o:["Quase todos","Mais da metade","Menos da metade","Quase nenhum"],se:["p2",LIDER]},
 {id:"p26",s:"Para a liderança",t:"aberta",q:"Na sua percepção, do que os adolescentes e jovens do seu grupo mais sentem falta na igreja?",se:["p2",LIDER]},
 {id:"p27",s:"Para a liderança",t:"aberta",q:"Você já viu alguma ação que aproximou os jovens de outras gerações? Qual?",se:["p2",LIDER]},
 {id:"p28",s:"Para a liderança",t:"aberta",q:"Que apoio você precisaria pra estimular isso no seu grupo?",se:["p2",LIDER]}
];
