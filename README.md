# Desafio Software Engineer - Backend - Node

Olá! Esse desafio técnico tem como propósito medir suas habilidades, ver como estuda, pensa e se organiza na prática. A stack tecnológica utilizada é de sua escolha. Solicitamos que seja utilizado Node com Typescript.

Após finalizar o desafio, nos envie um link para repositório do projeto.

Existem diversas maneiras e profundidades de solucionar o problema que estamos propondo. Vamos listar algumas sub-tasks que podem guiá-lo(a) em relação a essas possibilidades.

## O desafio

A Konsi coleta uma variedade de dados que não são facilmente acessíveis, para propor melhores opções de créditos para seus clientes. Um dos tipos de dados coletados é o número da matrícula e código do tipo do benefício do aposentado ou pensionista.

O desafio é fazer uma API que busque e retorne a matrícula do servidor em uma determinada API externa.

Será necessário desenvolver uma aplicação para coletar esse dado na API externa, uma API para fazer input e buscar o resultado depois.

## A aplicação

É necessário realizar geração de token com as credenciais que vamos fornecer, consultar o CPF do cliente e retornar os dados de benefícios encontrados (número do benefício e código do tipo do benefício).

- Gerar token: POST `/api/v1/token` com o seguinte `body`:
  ```
  {
    "username": string,
    "password": string
  }
  ```
- Buscar dados de benefícios: GET `/api/v1/inss/consulta-beneficios?cpf={cpf}`

Obs: A URL base e credenciais serão enviadas no privado. Caso não tenha recebido, favor solicitar.

### Dado a ser coletado:

* Lista de números das matrículas (número do benefício) com o respectivo código do tipo de benefício.

### Etapas obrigatórias:

* A lista de CPFs deve ser inicialmente colocada em uma fila do **RabbitMQ.**
* Na fila do rabbitmq, devem existir CPFs repetidos.
* Ao consumir da fila do **RabbitMQ** um CPF, o sistema deve verificar previamente no cache do **Redis** se existe um JSON com os dados referentes CPF.
* Após realizar a consulta, os dados de matriculas de um CPF devem ser indexados utilizando **Elasticsearch**.
* Construir uma interface web com um campo de busca. Ao digitar um CPF, o sistema deve verificar no **Elasticsearch** se existem informações de matrícula para o CPF desejado.


## Alguns pontos que serão analisados:

* Organização do código
* Testes
* Facilidade ao rodar o projeto
* Escalabilidade: o quao fácil é escalar a aplicação.
* Performance: aqui avaliaremos o tempo para resgatar e tratar os dados.


*Happy coding! :-)*
