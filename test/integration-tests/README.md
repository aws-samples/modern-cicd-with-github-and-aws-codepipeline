# Device Farm Tests
```
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export BASE_URL=<HOTELAPP_URL>
#only need to set this if you want to test remotely on a Selenium 
export GRID_URL=$(aws devicefarm create-test-grid-url --project-arn <DEVICEFARM_PROJECT_URL> --expires-in-seconds 600 --query 'url' --output text --region=us-west-2)
pytest --junit-xml=results-out.xml```
