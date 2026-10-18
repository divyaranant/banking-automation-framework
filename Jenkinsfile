// Parameterised pipeline: one job serves every bank. Runs are manual and gated, because
// real FI runs hit production with real accounts (penny transactions only).
pipeline {
  // Runs on the Jenkins agent directly (no Docker Pipeline plugin required).
  // Requires Node.js on the agent; `playwright install` below provisions the browser.
  agent any

  parameters {
    string(name: 'BANK', defaultValue: 'demo-retail-bank', description: 'Folder name under banks/')
    choice(name: 'SUITE', choices: ['smoke', 'build', 'sit', 'all'], description: 'smoke=upgrade check, build=new env, sit=pre go-live')
    string(name: 'FEATURES', defaultValue: '', description: 'Comma-separated subset of the bank\'s features to run, e.g. "accounts,transfers". Leave blank to run every feature the bank supports.')
    booleanParam(name: 'BROWSERSTACK', defaultValue: false, description: 'Execute on BrowserStack instead of the local container browser')
    booleanParam(name: 'PRODUCTION', defaultValue: false, description: 'Target bank env is production -> requires approval')
    booleanParam(name: 'SYNC_TEST_MANAGEMENT', defaultValue: true, description: 'Upload the JUnit report to BrowserStack Test Management as a Test Run (pass/fail/untested)')
  }

  options {
    timeout(time: 60, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  environment {
    CI = 'true'
    VAULT_ADDR = credentials('vault-addr')   // Jenkins "secret text"; leave unset to use demo provisioning
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
        bat 'npm ci'
        bat 'npx playwright install chromium'
      }
    }

    stage('Validate bank config') {
      steps {
        bat "node -e \"require('./lib/bank-context').loadBank(process.env.BANK)\""
      }
    }

    stage('Test') {
      steps {
        withCredentials([string(credentialsId: "vault-token", variable: 'VAULT_TOKEN')]) {
          script {
            def runner = params.BROWSERSTACK ? 'npx browserstack-node-sdk playwright test' : 'npx playwright test'
            withEnv(["BANK=${params.BANK}", "SUITE=${params.SUITE}", "FEATURES=${params.FEATURES}"]) {
              if (params.BROWSERSTACK) {
                withCredentials([usernamePassword(credentialsId: 'browserstack', usernameVariable: 'BROWSERSTACK_USERNAME', passwordVariable: 'BROWSERSTACK_ACCESS_KEY')]) {
                  bat runner
                }
              } else {
                bat runner
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
      // HTML Publisher plugin isn't installed; the report is still browsable from the
      // archived artifacts below (reports/<bank>/html/index.html).
      archiveArtifacts artifacts: "reports/${params.BANK}/**", allowEmptyArchive: true

      script {
        // Creates/updates a BrowserStack Test Management Test Run from the JUnit report
        // (pass/fail/untested per test case). Screenshots/video/trace stay in the HTML
        // report above -> Test Management's JUnit importer doesn't accept attachments.
        def junitPath = "reports/${params.BANK}/junit.xml"
        if (params.SYNC_TEST_MANAGEMENT && fileExists(junitPath)) {
          withCredentials([string(credentialsId: 'test-management-api-token', variable: 'TEST_MANAGEMENT_API_TOKEN')]) {
            bat "curl -sS -k -X POST https://test-management.browserstack.com/api/v1/import/results/xml/junit -u \"%TEST_MANAGEMENT_API_TOKEN%\" -F project_name=\"Banking Automation Framework\" -F file_path=@${junitPath} -F test_run_name=\"${params.BANK} - ${params.SUITE} - build #${env.BUILD_NUMBER}\" || exit /b 0"
          }
        }
      }
    }
  }
}
