pipeline {
    agent any

    environment {
        // Customize with your Docker Hub username
        DOCKER_HUB_REPO = 'aditi20k/expensetracker'
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout Source') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Build & Test Local Code') {
            steps {
                echo 'Installing client dependencies & building static assets...'
                dir('client') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
                echo 'Verifying server syntax...'
                dir('server') {
                    sh 'npm ci'
                    sh 'node -c server.js'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Building Docker Images...'
                // Build unified production container image
                sh "docker build -t ${DOCKER_HUB_REPO}:latest -t ${DOCKER_HUB_REPO}:${IMAGE_TAG} ."
                // Optionally build separate backend/frontend images:
                // sh "docker build -t ${DOCKER_HUB_REPO}-backend:${IMAGE_TAG} ./server"
                // sh "docker build -t ${DOCKER_HUB_REPO}-frontend:${IMAGE_TAG} ./client"
            }
        }

        stage('Run Health Check Test Container') {
            steps {
                echo 'Running container healthcheck verification...'
                script {
                    sh """
                        docker run -d --name test-container-${BUILD_NUMBER} \
                            -p 5005:5000 \
                            -e MONGO_URI="mongodb://localhost:27017/testdb" \
                            -e JWT_SECRET="test_secret_key_123" \
                            ${DOCKER_HUB_REPO}:${IMAGE_TAG} || true
                        
                        sleep 5
                        docker ps | grep test-container-${BUILD_NUMBER} || true
                        docker stop test-container-${BUILD_NUMBER} || true
                        docker rm test-container-${BUILD_NUMBER} || true
                    """
                }
            }
        }

        stage('Push to Docker Hub Registry') {
            steps {
                script {
                    echo 'Logging into Docker Hub and pushing image...'
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                        sh "docker push ${DOCKER_HUB_REPO}:${IMAGE_TAG}"
                        sh "docker push ${DOCKER_HUB_REPO}:latest"
                    }
                }
            }
        }

        stage('Deploy via Docker Compose') {
            steps {
                echo 'Deploying application using Docker Compose...'
                sh "docker-compose down || true"
                sh "docker-compose up -d --build"
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker workspace...'
            sh 'docker image prune -f'
        }
        success {
            echo 'Pipeline completed successfully! Expense Tracker is deployed.'
        }
        failure {
            echo 'Pipeline failed. Check Jenkins logs for details.'
        }
    }
}
