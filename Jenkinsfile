// Parameterised pipeline: one job serves every bank. Runs are manual and gated, because
// real FI runs hit production with real accounts (penny transactions only).
pipeline {
  agent {
    docker {
      // keep the tag in sync with @playwright/test in package.json
      image 'mcr.microsoft.com/playwright:v1.64.1-noble'
      args '--ipc=host'
    }
  }

  parameters {
    string(name: 'BANK', defaultValue: 'demo-retail-bank', description: 'Folder name under banks/')
    choice(name: 'SUITE', choices: ['smoke', 'build', 'sit', 'all'], description: 'smoke=upgrade check, build=new env, sit=pre go-live')
    booleanParam(name: 'BROWSERSTACK', defaultValue: false, description: 'Execute on BrowserStack instead of the local container browser')
    booleanParam(name: 'PRODUCTION', defaultValue: false, description: 'Target bank env is production -> requires approval')
  }

  options {
    timeout(time: 60, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  environment {
    CI = 'true'
    VAULT_ADDR = credentials('vault-addr')   // Jenkins "secret text"; leave unset to use demo provisioning
    SUITE_ARG = "${params.SUITE == 'all' ? '' : params.SUITE}"
  }

  stages {
    stage('Approval gate') {
      when { expression { params.PRODUCTION } }
      steps {
        script {
          // Bank + PM sign-off before touching a production FI.
          def approver = input(
            message: "Run ${params.BANK} ${params.SUITE} against PRODUCTION?",
            submitter: 'qa-leads,project-managers',
            submitterParameter: 'APPROVER'
          )
          env.APPROVED_BY = approver
        }
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Validate bank config') {
      steps {
        sh 'node -e "require(\'./lib/bank-context\').loadBank(process.env.BANK)"'
      }
    }

    stage('Test') {
      steps {
        withCredentials([string(credentialsId: "vault-token", variable: 'VAULT_TOKEN')]) {
          script {
            def runner = params.BROWSERSTACK ? 'npx browserstack-node-sdk playwright test' : 'npx playwright test'
            withEnv(["BANK=${params.BANK}", "SUITE=${env.SUITE_ARG}"]) {
              if (params.BROWSERSTACK) {
                withCredentials([usernamePassword(credentialsId: 'browserstack', usernameVariable: 'BROWSERSTACK_USERNAME', passwordVariable: 'BROWSERSTACK_ACCESS_KEY')]) {
                  sh runner
                }
              } else {
                sh runner
              }
            }
          }
        }
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: "reports/${params.BANK}/junit.xml"
      publishHTML(target: [
        reportDir: "reports/${params.BANK}/html",
        reportFiles: 'index.html',
        reportName: "Playwright - ${params.BANK}",
        keepAll: true,
        allowMissing: true,
        alwaysLinkToLastBuild: true
      ])
      archiveArtifacts artifacts: "reports/${params.BANK}/**", allowEmptyArchive: true
    }
  }
}
