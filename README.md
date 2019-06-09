# project-building-api
##### Este é um servidor Node baseado em Express com arquitetura RESTFUL que aceita requisições HTTP buscando solucionar o seguinte problema
> Considere um grande e movimentado complexo de edifícios comerciais de escritórios. Por
motivos de segurança, é necessário realizar o controle de acesso de todas as pessoas que
frequentam o complexo habitual (funcionários) ou esporadicamente (visitantes, clientes etc.).
Políticas de acesso diferentes são aplicáveis a funcionários da administração do condomínio,
funcionários das empresas que possuem escritórios no local e visitantes em geral. Na entrada do
complexo, há um conjunto de pontos de acesso (como catracas eletrônicas), por meio dos quais
as pessoas se identificam (usando biometria, por exemplo) antes de serem autorizadas a entrar
nas instalações. Pontos de acesso também são instalados na entrada de cada prédio e na
entrada de cada andar de um prédio, uma vez que funcionários das empresas condôminas,
assim como os visitantes, só devem ter acesso a certas partes do complexo. Finalmente,
também por motivos de segurança em caso de emergências, o complexo possui uma
capacidade de lotação máxima total, por prédio e por andar. Desta forma, um visitante, mesmo
que possua as credenciais necessárias, só pode ser admitido no complexo, prédio ou andar se
as respectivas capacidades máximas não tiverem sido excedidas. Note que funcionários não
estão sujeitos a este controle de lotação, embora devam ser contados para fins de cálculo da
capacidade de ocupação disponível. Os parâmetros do sistema, em particular as políticas de
acesso aplicáveis aos três tipos de ocupantes do edifício e as capacidades máximas (dos
complexo, dos edifícios e de cada andar), devem ser definidos no início da operação do sistema
pelo(a) administrador(a) do condomínio, podendo ser reajustados por ele(a) a qualquer momento.
## Instalação
#### Lembrando que esta versão está configurada para acessar o banco de dados localmente (127.0.0.1:27017)
1. Tenha o node e o npm instalados. Caso queira executar localmente, tenha também o MongoDB instalado.
2. Clone o repositório via terminal.
3. Acesse a pasta de destino via cd project-building-api
4. Execute sudo npm install
5. Execute sudo npm start
