# Safari Stickerbook
This app combines the classifcation power of YOLOV8 and the segmentation capabilities of Meta's Segment Anything Model (SAM) to create a easy to use animal segmentation app. 

## Steps for Installation:<br><br>
&emsp;Prereq: Python 3.9.16 is required.

1) From your terminal clone this repository by using:
    `git clone https://github.com/roydipta/capstone.git`
2) Navigate to the directory where downloaded
3) Create a virtual environment `python3 -m venv name_of_environment`
4) Activate the virtual environment: <br>
&emsp; on macOS or Linux use: `source name_of_environment/bin/activate`<br>
&emsp; on windows use: `.\name_of_environment\Scripts\activate`
5) Now pip install the requirement.txt file by using the command: `pip install -r requirements.txt`
6) Lastly use `flask run` to run the application
<br>&emsp; This will also download the model weights file (about 350 mb) for you on your local drive where the repo is cloned.
