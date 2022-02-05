const Puppeteer = require("puppeteer");
require("dotenv").config();
const jwt = require("jsonwebtoken");

// Form de Login
const form = {
  userSelector: "#vSIS_USUARIOID",
  passwordSelector: "#vSIS_USUARIOSENHA",
  button: "input[type=button]",
  message: "#span_vSAIDA",
};

// URL do SIGA
const url = "http://siga.cps.sp.gov.br/aluno/login.aspx";

// Iniciando navegador
async function startBrowser() {
  const browser = await Puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  return { browser, page };
}

// Fechando navegador
async function closeBrowser(browser) {
  return browser.close();
}

async function loginBeforeAction(token) {
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);

      const { browser, page } = await startBrowser();
      await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
      await page.type(form.userSelector, decoded.user);
      await page.type(form.passwordSelector, decoded.password);
      await page.click(form.button);

      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 5000,
      });

      return { browser, page, status: 200 };
    } catch (error) {
      return { message: "Erro ao logar!", status: 500 };
    }
  } else {
    return { message: "Token não encontrado", status: 500 };
  }
}

// Função de login
async function login(user, password) {
  const { browser, page } = await startBrowser();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
  await page.type(form.userSelector, user);
  await page.type(form.passwordSelector, password);
  await page.click(form.button);
  try {
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 5000 });
    const token = jwt.sign({ user, password }, process.env.SECRET_KEY);
    closeBrowser(browser);
    return { token, status: 200 };
  } catch (error) {
    closeBrowser(browser);
    return { message: "Usuário ou senha inválidos", status: 500 };
  }
}

// Página principal
async function index(token) {
  const data = await loginBeforeAction(token);
  if (data.status === 200) {
    const browser = data.browser;
    const page = data.page;
    const itens_menu = [];
    let contador = 0;

    try {
      while (true) {
        contador++;
        try {
          let elemento = {
            name: await page.$eval(
              `#ygtvlabelel${contador}Span`,
              (el) => el.innerText
            ),
            url: await page.$eval(`#ygtvlabelel${contador}`, (el) => el.href),
          };

          itens_menu.push(elemento);
        } catch (e) {
          break;
        }
      }

      const extracted_data = {
        name: await page.$eval(
          "#span_MPW0041vPRO_PESSOALNOME",
          (el) => el.innerText
        ),
        email: await page.$eval(
          "#span_MPW0041vINSTITUCIONALFATEC",
          (el) => el.innerText
        ),
        ra: await page.$eval(
          "#span_MPW0041vACD_ALUNOCURSOREGISTROACADEMICOCURSO",
          (el) => el.innerText
        ),
        profile_picture: await page.$eval("#MPW0041FOTO > img", (el) => el.src),
        course_schedule: await page.$eval(
          "#TABLEFATEC_MPAGE > tbody > tr:nth-child(1) > td",
          (el) => el.innerText.substring(58)
        ),
        cicle: await page.$eval(
          "#span_MPW0041vACD_ALUNOCURSOCICLOATUAL",
          (el) => el.innerText
        ),
        yield: {
          progression: await page.$eval(
            "#span_MPW0041vACD_ALUNOCURSOINDICEPP",
            (el) => el.innerText
          ),
          average_grade: await page.$eval(
            "#span_MPW0041vACD_ALUNOCURSOINDICEPR",
            (el) => el.innerText
          ),
          highest_average_grade: await page.$eval(
            "#span_MPW0041vMAX_ACD_ALUNOCURSOINDICEPR",
            (el) => el.innerText
          ),
        },
        school_subjects: itens_menu.filter(
          (item) =>
            itens_menu.indexOf(item) > 21 &&
            itens_menu.indexOf(item) < itens_menu.length - 2
        ),
        banner: {
          url: await page.$eval("#TABLE5 > tbody > tr:nth-child(5) > td > a", (el) => el.href),
          image: await page.$eval("#vBANNER", (el) => el.src),
        }
      };

      closeBrowser(browser);

      return { status: 200, data: extracted_data };
    } catch (error) {
      closeBrowser(browser);
      return { message: "Erro ao extrair dados", status: 500 };
    }
  } else {
    return { status: data.status, error: data.message };
  }
}

async function subject(token, subject_url) {
  const data = await loginBeforeAction(token);

  if (data.status === 200) {
    await data.page.goto(subject_url, {
      waitUntil: "networkidle2",
      timeout: 0,
    });
    await data.page.waitForSelector("#W0008W0013TABLE1");
    const extracted_data = await data.page.$eval(
      "#W0008W0013TABLE1",
      (el) => el.innerHTML
    );

    closeBrowser(data.browser);
    return { status: 200, data: extracted_data };
  } else {
    closeBrowser(data.browser);
    return { status: data.status, error: data.message };
  }
}

module.exports = { login, index, subject };
